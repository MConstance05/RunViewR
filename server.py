#!/usr/bin/env python3
import json, os, time, urllib.parse, urllib.request, webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / '.env'
TOKENS_FILE = BASE_DIR / 'tokens.json'
DEFAULT_PORT = int(os.environ.get('RUNVIEWR_PORT', '8000'))


def load_env():
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    for k in ['STRAVA_CLIENT_ID', 'STRAVA_CLIENT_SECRET', 'RUNVIEWR_PORT']:
        if os.environ.get(k):
            env[k] = os.environ[k]
    return env


def json_response(handler, status, payload):
    body = json.dumps(payload).encode('utf-8')
    handler.send_response(status)
    handler.send_header('Content-Type', 'application/json; charset=utf-8')
    handler.send_header('Content-Length', str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def read_tokens():
    if TOKENS_FILE.exists():
        try:
            return json.loads(TOKENS_FILE.read_text(encoding='utf-8'))
        except Exception:
            return {}
    return {}


def write_tokens(tokens):
    TOKENS_FILE.write_text(json.dumps(tokens, indent=2), encoding='utf-8')


def delete_tokens():
    if TOKENS_FILE.exists():
        TOKENS_FILE.unlink()


class StravaClient:
    base = 'https://www.strava.com/api/v3'
    oauth = 'https://www.strava.com/oauth'

    def __init__(self, env, port):
        self.env = env
        self.port = port

    @property
    def client_id(self):
        return self.env.get('STRAVA_CLIENT_ID', '').strip()

    @property
    def client_secret(self):
        return self.env.get('STRAVA_CLIENT_SECRET', '').strip()

    @property
    def configured(self):
        return bool(self.client_id and self.client_secret)

    @property
    def redirect_uri(self):
        return f'http://localhost:{self.port}/oauth/strava/callback'

    def auth_url(self):
        if not self.configured:
            return None
        params = {
            'client_id': self.client_id,
            'response_type': 'code',
            'redirect_uri': self.redirect_uri,
            'approval_prompt': 'auto',
            'scope': 'read,activity:read_all',
        }
        return f'https://www.strava.com/oauth/authorize?{urllib.parse.urlencode(params)}'

    def _post_form(self, url, data):
        req = urllib.request.Request(url, data=urllib.parse.urlencode(data).encode('utf-8'), method='POST')
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        try:
            with urllib.request.urlopen(req) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8', 'replace')
            try:
                payload = json.loads(body)
            except Exception:
                payload = {'message': body}
            raise RuntimeError(payload.get('message') or f'Strava token exchange failed ({e.code})')

    def exchange_code(self, code):
        if not self.configured:
            raise RuntimeError('Strava is not configured yet. Add STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET to .env first.')
        payload = self._post_form(f'{self.oauth}/token', {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'code': code,
            'grant_type': 'authorization_code',
        })
        payload['obtained_at'] = int(time.time())
        write_tokens(payload)
        return payload

    def refresh_if_needed(self):
        tokens = read_tokens()
        if not tokens:
            return None
        expires_at = int(tokens.get('expires_at') or 0)
        if expires_at - int(time.time()) > 300 and tokens.get('access_token'):
            return tokens
        if not tokens.get('refresh_token'):
            return tokens
        payload = self._post_form(f'{self.oauth}/token', {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'grant_type': 'refresh_token',
            'refresh_token': tokens['refresh_token'],
        })
        payload['obtained_at'] = int(time.time())
        write_tokens(payload)
        return payload

    def api_get(self, path):
        tokens = self.refresh_if_needed()
        if not tokens or not tokens.get('access_token'):
            raise RuntimeError('Not connected to Strava yet.')
        req = urllib.request.Request(f'{self.base}{path}')
        req.add_header('Authorization', f"Bearer {tokens['access_token']}")
        try:
            with urllib.request.urlopen(req) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8', 'replace')
            try:
                payload = json.loads(body)
            except Exception:
                payload = {'message': body}
            msg = payload.get('message') or f'Strava API failed ({e.code})'
            if e.code == 401:
                delete_tokens()
                raise RuntimeError('Stored Strava login expired or was revoked. Click Connect with Strava again.')
            raise RuntimeError(msg)


def transform_strava(a):
    dist_km = (a.get('distance') or 0) / 1000
    moving = a.get('moving_time') or 0
    elapsed = a.get('elapsed_time') or moving
    pace_sec = round(moving / dist_km) if dist_km > 0 else 300
    splits = []
    for i, lap in enumerate(a.get('splits_metric') or []):
        lap_dist = (lap.get('distance') or 0) / 1000
        lap_elapsed = lap.get('elapsed_time') or 0
        splits.append({'km': i + 1, 'dist': lap_dist, 'paceSec': round(lap_elapsed / lap_dist) if lap_dist > 0 else 0})
    streams = a.get('_streams') or {}
    alt = (streams.get('altitude') or {}).get('data', [])
    hr = (streams.get('heartrate') or {}).get('data', [])
    vel = (streams.get('velocity_smooth') or {}).get('data', [])
    latlng = (streams.get('latlng') or {}).get('data', [])
    route_points = []
    if len(latlng) > 1:
        step = max(1, len(latlng)//10)
        sampled = latlng[::step][:10]
        lats = [p[0] for p in sampled]
        lngs = [p[1] for p in sampled]
        min_lat, max_lat = min(lats), max(lats)
        min_lng, max_lng = min(lngs), max(lngs)
        for lat, lng in sampled:
            x = round(40 + ((lng - min_lng) / ((max_lng - min_lng) or 1)) * 360)
            y = round(170 - ((lat - min_lat) / ((max_lat - min_lat) or 1)) * 140)
            route_points.append([x, y])
    date_local = (a.get('start_date_local') or '').replace('Z', '')
    date_part = date_local.split('T')[0] if 'T' in date_local else date_local
    time_part = (date_local.split('T')[1][:5] if 'T' in date_local else '00:00')
    name = (a.get('name') or '').lower()
    avg_pace_sec = round(elapsed / dist_km) if dist_km > 0 else 300
    if dist_km >= 14 or 'long' in name:
        run_type = 'long'
    elif avg_pace_sec < 280 or 'tempo' in name or 'threshold' in name:
        run_type = 'tempo'
    elif 'recov' in name or 'easy' in name or avg_pace_sec > 360:
        run_type = 'recovery'
    else:
        run_type = 'easy'

    def fmt_duration(secs):
        h = secs // 3600
        m = (secs % 3600) // 60
        s = secs % 60
        return f"{h}:{m:02d}:{s:02d}" if h > 0 else f"{m}:{s:02d}"

    def fmt_pace(sec_per_km):
        m = sec_per_km // 60
        s = sec_per_km % 60
        return f"{m}:{s:02d}"

    return {
        'id': a['id'],
        'title': a.get('name') or 'Run',
        'date': date_part,
        'startTime': time_part,
        'distance': round(dist_km, 2),
        'duration': moving,
        'durationStr': fmt_duration(moving),
        'pace': fmt_pace(pace_sec),
        'paceSec': pace_sec,
        'elevationGain': round(a.get('total_elevation_gain') or 0),
        'location': ', '.join([x for x in [a.get('location_city'), a.get('location_state'), a.get('location_country')] if x]) or 'Unknown',
        'splits': splits,
        'elevationProfile': alt if len(alt) > 1 else [],
        'hrProfile': hr if len(hr) > 1 else [],
        'paceProfile': [round(1000/v) if v > 0 else 360 for v in vel] if len(vel) > 1 else [],
        'routePoints': route_points,
        'calories': a.get('calories') or round(dist_km * 67),
        'heartRate': {'avg': round(a.get('average_heartrate') or 0), 'max': round(a.get('max_heartrate') or 0)},
        'type': run_type,
        'cadence': round((a.get('average_cadence') or 85) * 2),
        '_source': 'strava',
        '_stravaId': a['id'],
    }


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.env = load_env()
        self.port = int(self.env.get('RUNVIEWR_PORT', DEFAULT_PORT))
        self.strava = StravaClient(self.env, self.port)
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)
        if path == '/api/strava/status':
            return self.handle_status()
        if path == '/api/strava/connect':
            return self.handle_connect()
        if path == '/api/strava/activities':
            return self.handle_activities()
        if path.startswith('/api/strava/activities/'):
            return self.handle_activity_detail(path.rsplit('/', 1)[-1])
        if path == '/oauth/strava/callback':
            return self.handle_callback(query)
        if path == '/api/health':
            return json_response(self, 200, {'ok': True})
        if path == '/':
            self.path = '/RunViewR.html'
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/strava/disconnect':
            delete_tokens()
            return json_response(self, 200, {'ok': True})
        return json_response(self, 404, {'detail': 'Not found'})

    def handle_status(self):
        payload = {'configured': self.strava.configured, 'connected': False, 'auth_url': self.strava.auth_url()}
        if not self.strava.configured:
            payload['detail'] = 'Add STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET to .env.'
            return json_response(self, 200, payload)
        if not read_tokens():
            return json_response(self, 200, payload)
        try:
            fresh = self.strava.refresh_if_needed()
            athlete = self.strava.api_get('/athlete')
            payload.update({
                'connected': True,
                'athlete_name': f"{athlete.get('firstname', '')} {athlete.get('lastname', '')}".strip(),
                'athlete_id': athlete.get('id'),
                'expires_at': fresh.get('expires_at'),
            })
        except Exception as e:
            payload['detail'] = str(e)
        return json_response(self, 200, payload)

    def handle_connect(self):
        if not self.strava.configured:
            return json_response(self, 400, {'detail': 'Add STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET to .env first.'})
        url = self.strava.auth_url()
        try:
            webbrowser.open(url)
        except Exception:
            pass
        return json_response(self, 200, {'ok': True, 'auth_url': url})

    def handle_callback(self, query):
        code = (query.get('code') or [''])[0]
        target = '/RunViewR.html?strava=connected'
        if not code:
            target = '/RunViewR.html?strava=missing_code'
        else:
            try:
                self.strava.exchange_code(code)
            except Exception as e:
                target = '/RunViewR.html?strava=error&message=' + urllib.parse.quote(str(e))
        self.send_response(302)
        self.send_header('Location', target)
        self.end_headers()

    def handle_activities(self):
        all_acts = []
        page = 1
        per_page = 100
        while True:
            batch = self.strava.api_get(f'/athlete/activities?per_page={per_page}&page={page}')
            if not batch:
                break
            runs = [a for a in batch if a.get('type') == 'Run' or a.get('sport_type') == 'Run']
            all_acts.extend(transform_strava(a) for a in runs)
            if len(batch) < per_page:
                break
            page += 1
        all_acts.sort(key=lambda a: (a['date'], a['startTime']), reverse=True)
        return json_response(self, 200, {'activities': all_acts})

    def handle_activity_detail(self, activity_id):
        detail = self.strava.api_get(f'/activities/{activity_id}')
        try:
            streams = self.strava.api_get(f'/activities/{activity_id}/streams?keys=altitude,heartrate,velocity_smooth,latlng&key_by_type=true')
        except Exception:
            streams = {}
        detail['_streams'] = streams
        return json_response(self, 200, transform_strava(detail))


if __name__ == '__main__':
    env = load_env()
    port = int(env.get('RUNVIEWR_PORT', DEFAULT_PORT))
    print(f'RunViewR local server starting on http://localhost:{port}/RunViewR.html')
    server = ThreadingHTTPServer(('localhost', port), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down.')
