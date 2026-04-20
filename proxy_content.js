window.PROXY_FILES = {
  'server.py': `#!/usr/bin/env python3
"""
RunViewR — Garmin Connect Proxy
A minimal local server that authenticates with Garmin Connect and
serves your activity data to the RunViewR web app.

Run:  python server.py
Then: configure RunViewR Settings → Garmin → Proxy URL → http://localhost:8765
"""

import json
import os
import logging
from datetime import date, timedelta
from pathlib import Path
from typing import Optional

try:
    from fastapi import FastAPI, HTTPException, Query
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    import uvicorn
except ImportError:
    print("Missing dependencies. Run:  pip install -r requirements.txt")
    raise

try:
    from garminconnect import Garmin, GarminConnectAuthenticationError
except ImportError:
    print("Missing garminconnect. Run:  pip install -r requirements.txt")
    raise

# ── Config ───────────────────────────────────────────────────────────────────
PORT = 8765
TOKEN_FILE = Path.home() / ".garminconnect" / "garmin_tokens.json"
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("runviewr-proxy")

# ── State ────────────────────────────────────────────────────────────────────
garmin: Optional[Garmin] = None

app = FastAPI(title="RunViewR Garmin Proxy", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # RunViewR opens from file:// or localhost
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Helpers ──────────────────────────────────────────────────────────────────
def get_garmin() -> Garmin:
    global garmin
    if garmin is None:
        raise HTTPException(status_code=401, detail="Not authenticated. POST /auth/login first.")
    return garmin


def fmt_duration(secs: int) -> str:
    h, rem = divmod(int(secs), 3600)
    m, s = divmod(rem, 60)
    if h:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def fmt_pace(sec_per_km: float) -> str:
    if sec_per_km <= 0:
        return "—"
    m = int(sec_per_km // 60)
    s = round(sec_per_km % 60)
    return f"{m}:{s:02d}"


def classify_type(name: str, dist_km: float, pace_sec: float) -> str:
    name_lc = (name or "").lower()
    if dist_km >= 14 or "long" in name_lc:
        return "long"
    if pace_sec < 280 or "tempo" in name_lc or "threshold" in name_lc:
        return "tempo"
    if "recov" in name_lc or "easy" in name_lc or pace_sec > 360:
        return "recovery"
    return "easy"


def transform_activity(a: dict) -> dict:
    """Convert Garmin Connect activity dict → RunViewR format."""
    dist_m = a.get("distance", 0) or 0
    dist_km = dist_m / 1000
    duration = a.get("duration", a.get("movingDuration", 0)) or 0
    pace_sec = duration / dist_km if dist_km > 0 else 300

    start = a.get("startTimeLocal", "") or ""
    date_part = start[:10] if len(start) >= 10 else ""
    time_part = start[11:16] if len(start) >= 16 else "00:00"

    avg_hr = a.get("averageHR", 0) or 0
    max_hr = a.get("maxHR", 0) or 0
    cadence_raw = a.get("averageRunningCadenceInStepsPerMinute", 0) or 0

    return {
        "id": a.get("activityId"),
        "title": a.get("activityName", "Run"),
        "date": date_part,
        "startTime": time_part,
        "distance": round(dist_km, 2),
        "duration": int(duration),
        "durationStr": fmt_duration(duration),
        "pace": fmt_pace(pace_sec),
        "paceSec": round(pace_sec),
        "elevationGain": round(a.get("elevationGain", 0) or 0),
        "location": a.get("locationName") or "",
        "splits": [],
        "elevationProfile": [],
        "hrProfile": [],
        "paceProfile": [],
        "routePoints": [],
        "calories": a.get("calories", 0) or round(dist_km * 67),
        "heartRate": {"avg": round(avg_hr), "max": round(max_hr)},
        "type": classify_type(a.get("activityName", ""), dist_km, pace_sec),
        "cadence": round(cadence_raw * 2) if cadence_raw else 170,
        "_source": "garmin",
        "_garminId": a.get("activityId"),
    }


def transform_activity_detail(summary: dict, details: dict) -> dict:
    """Merge activity summary + detail streams into RunViewR format."""
    base = transform_activity(summary)

    # Splits from laps
    laps = details.get("activityDetailMetrics", []) or []
    splits = []
    for i, lap in enumerate(laps):
        dist = (lap.get("distance") or 0) / 1000
        dur = lap.get("duration") or 0
        pace = dur / dist if dist > 0 else 300
        splits.append({"km": i + 1, "dist": round(dist, 2), "paceSec": round(pace)})
    base["splits"] = splits

    # Metric streams
    metrics = details.get("geoPolylineDTO", {}) or {}
    polyline = metrics.get("polyline", []) or []

    # Pull HR + pace from detailMetrics if available
    detail_metrics = details.get("detailMetrics", []) or []
    hr_vals, pace_vals, alt_vals = [], [], []
    for point in detail_metrics:
        if point.get("heartRate"):
            hr_vals.append(round(point["heartRate"]))
        v = point.get("speed")
        if v and v > 0:
            pace_vals.append(round(1000 / v))
        if point.get("altitude") is not None:
            alt_vals.append(round(point["altitude"]))

    # Downsample to ~40 points for charts
    def downsample(arr, n=40):
        if len(arr) <= n:
            return arr
        step = len(arr) / n
        return [arr[round(i * step)] for i in range(n)]

    base["hrProfile"] = downsample(hr_vals)
    base["paceProfile"] = downsample(pace_vals)
    base["elevationProfile"] = downsample(alt_vals)

    # Route points from polyline (normalize to SVG coords)
    if polyline:
        step = max(1, len(polyline) // 10)
        pts = polyline[::step][:10]
        lats = [p["lat"] for p in pts]
        lngs = [p["lon"] for p in pts]
        min_lat, max_lat = min(lats), max(lats)
        min_lng, max_lng = min(lngs), max(lngs)
        base["routePoints"] = [
            [
                round(40 + ((p["lon"] - min_lng) / (max_lng - min_lng + 1e-9)) * 360),
                round(170 - ((p["lat"] - min_lat) / (max_lat - min_lat + 1e-9)) * 140),
            ]
            for p in pts
        ]

    return base


# ── Auth routes ───────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/auth/login")
async def login(body: LoginRequest):
    """Authenticate with Garmin Connect and persist tokens."""
    global garmin
    log.info(f"Authenticating {body.username}…")
    try:
        client = Garmin(body.username, body.password)
        client.login()
        garmin = client
        # Save tokens — garth attribute varies by library version
        try:
            TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
            if hasattr(client, 'garth'):
                TOKEN_FILE.write_text(json.dumps(client.garth.dumps()))
            elif hasattr(client, 'dump_tokens'):
                client.dump_tokens(str(TOKEN_FILE))
        except Exception as te:
            log.warning(f"Could not save tokens (non-fatal): {te}")
        try:
            athlete_name = client.get_full_name()
        except Exception:
            athlete_name = body.username
        log.info(f"Authenticated as: {athlete_name}")
        return {"ok": True, "name": athlete_name}
    except GarminConnectAuthenticationError as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {e}")
    except Exception as e:
        msg = str(e)
        if '429' in msg or 'rate limit' in msg.lower():
            raise HTTPException(status_code=429, detail="Garmin rate-limited this IP. Wait 1–2 minutes and try again.")
        raise HTTPException(status_code=500, detail=msg)


@app.get("/auth/status")
async def auth_status():
    """Check if currently authenticated; attempt token resume if not."""
    global garmin
    if garmin:
        return {"authenticated": True}
    # Try to resume from saved tokens
    if TOKEN_FILE.exists():
        try:
            log.info("Resuming Garmin session from saved tokens…")
            client = Garmin()
            token_data = TOKEN_FILE.read_text()
            if hasattr(client, 'garth'):
                client.garth.loads(token_data)
            garmin = client
            log.info("Session resumed.")
            return {"authenticated": True, "resumed": True}
        except Exception as e:
            log.warning(f"Token resume failed: {e}")
    return {"authenticated": False}


@app.post("/auth/logout")
async def logout():
    global garmin
    garmin = None
    if TOKEN_FILE.exists():
        TOKEN_FILE.unlink()
    return {"ok": True}


# ── Activity routes ───────────────────────────────────────────────────────────
@app.get("/activities")
async def get_activities(
    limit: int = Query(default=200, le=1000),
    start: int = Query(default=0),
):
    """Return all running activities, newest first."""
    client = get_garmin()
    log.info(f"Fetching activities (start={start}, limit={limit})…")
    try:
        raw = client.get_activities(start, limit)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Garmin fetch failed: {e}")

    runs = [a for a in raw if a.get("activityType", {}).get("typeKey", "").startswith("running")]
    transformed = [transform_activity(a) for a in runs]
    transformed.sort(key=lambda a: (a["date"], a["startTime"]), reverse=True)
    log.info(f"Returning {len(transformed)} running activities.")
    return {"activities": transformed, "total": len(transformed)}


@app.get("/activities/{activity_id}")
async def get_activity_detail(activity_id: int):
    """Return full detail for one activity including streams."""
    client = get_garmin()
    log.info(f"Fetching detail for activity {activity_id}…")
    try:
        details = client.get_activity_details(activity_id)
        # Get summary too (for base fields)
        activities = client.get_activities(0, 1)  # small hack; ideally cache
        summary = next(
            (a for a in client.get_activities(0, 200) if a.get("activityId") == activity_id),
            {}
        )
        return transform_activity_detail(summary, details)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "service": "RunViewR Garmin Proxy"}


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    log.info(f"Starting RunViewR Garmin Proxy on http://localhost:{PORT}")
    log.info("Configure RunViewR → Settings → Garmin → Proxy URL → http://localhost:8765")
    uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="warning")
`,
  'requirements.txt': `# RunViewR — Garmin Proxy dependencies
fastapi>=0.111.0
uvicorn[standard]>=0.29.0
garminconnect>=0.2.22
garth>=0.4.45
pydantic>=2.0.0
`,
  'README.md': `# RunViewR — Garmin Connect Proxy

A small local server that authenticates with Garmin Connect and serves your running data to the RunViewR web app.

---

## Setup

### 1. Install Python dependencies

**Windows (Command Prompt or PowerShell):**
\`\`\`bat
cd garmin-proxy
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
\`\`\`

**macOS / Linux:**
\`\`\`bash
cd garmin-proxy
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
\`\`\`

### 2. Run the proxy

**Windows:**
\`\`\`bat
python server.py
\`\`\`

**macOS / Linux:**
\`\`\`bash
python3 server.py
\`\`\`

You should see:
\`\`\`
Starting RunViewR Garmin Proxy on http://localhost:8765
\`\`\`

### 3. Configure RunViewR

1. Open RunViewR → **Settings**
2. Under **Garmin Connect**, set **Proxy URL** to \`http://localhost:8765\`
3. Enter your Garmin username and password
4. Click **Connect** — the proxy authenticates and saves a token locally
5. Click **Sync Now** to load your activities

---

## How it works

\`\`\`
RunViewR (browser)  ──fetch──▶  localhost:8765 (this proxy)  ──HTTPS──▶  connect.garmin.com
\`\`\`

The proxy handles Garmin's SSO authentication flow (same flow as the official Android app), obtains OAuth Bearer tokens, and stores them in \`~/.garminconnect/garmin_tokens.json\` so you only need to log in once. On subsequent starts it resumes automatically.

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| \`GET\` | \`/health\` | Check the proxy is running |
| \`GET\` | \`/auth/status\` | Check if authenticated |
| \`POST\` | \`/auth/login\` | Authenticate \`{ username, password }\` |
| \`POST\` | \`/auth/logout\` | Clear session + tokens |
| \`GET\` | \`/activities\` | All running activities (\`?limit=200&start=0\`) |
| \`GET\` | \`/activities/{id}\` | Full detail + streams for one activity |

---

## Security notes

- The proxy only listens on **localhost** (\`127.0.0.1\`) — it is not accessible from other machines on your network.
- Your Garmin credentials are sent to the proxy over localhost (not the internet), and never stored — only the resulting OAuth tokens are saved locally.
- Token file: \`~/.garminconnect/garmin_tokens.json\`
- To revoke access: run \`POST /auth/logout\` or delete the token file.

---

## Troubleshooting

**\`GarminConnectAuthenticationError\`** — wrong username/password, or Garmin is requiring MFA. Check your Garmin account settings.

**\`ModuleNotFoundError: garminconnect\`** — make sure you activated the virtual environment (\`source .venv/bin/activate\`) before running.

**Activities not showing** — Garmin occasionally changes their internal API. Update the library: \`pip install --upgrade garminconnect\`

**Port already in use** — change \`PORT = 8765\` in \`server.py\` to another port and update the proxy URL in RunViewR Settings.

---

## Requirements

- Python 3.9+
- A Garmin Connect account
- Garmin device synced to Garmin Connect
`,
};
