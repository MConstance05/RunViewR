// ApiService.js — Strava via local backend + Garmin scaffolding
(function () {

  const LOCAL_API = `${window.location.origin}/api`;
  function hasLocalBackend() {
    return /^https?:\/\/localhost(?::\d+)?$/i.test(window.location.origin);
  }
  async function apiGet(path) {
    const res = await fetch(`${LOCAL_API}${path}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || `Request failed (${res.status})`);
    return data;
  }
  async function apiPost(path, body) {
    const res = await fetch(`${LOCAL_API}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || `Request failed (${res.status})`);
    return data;
  }
  async function getStravaStatus() {
    if (!hasLocalBackend()) return { configured: false, connected: false, detail: 'Open RunViewR through the local server to use automatic Strava login.' };
    return apiGet('/strava/status');
  }
  async function startStravaConnect() {
    const data = await apiGet('/strava/connect');
    if (data.auth_url) window.location.href = data.auth_url;
    return data;
  }
  async function disconnectStrava() { return apiPost('/strava/disconnect'); }
  async function validateStravaToken() {
    if (hasLocalBackend()) {
      const status = await getStravaStatus();
      if (!status.configured) throw new Error(status.detail || 'Strava backend is not configured.');
      if (!status.connected) throw new Error(status.detail || 'Not connected to Strava yet. Click Connect with Strava first.');
      return { valid: true, name: status.athlete_name || 'Strava Athlete', id: status.athlete_id, activityAccess: true };
    }
    throw new Error('Automatic Strava login requires opening RunViewR through the local server.');
  }
  async function fetchStravaActivities(token, onProgress) {
    const data = await apiGet('/strava/activities');
    if (onProgress) onProgress((data.activities || []).length);
    return data.activities || [];
  }
  async function fetchStravaActivityDetail(id, token) { return apiGet(`/strava/activities/${id}`); }
  // ── Garmin Proxy ─────────────────────────────────────────────────────────────
  // Talks to the local garmin-proxy/server.py running on localhost:8765

  async function proxyGet(proxyUrl, path) {
    const base = (proxyUrl || 'http://localhost:8765').replace(/\/$/, '');
    const res = await fetch(`${base}${path}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Proxy error ${res.status}`);
    }
    return res.json();
  }

  async function proxyPost(proxyUrl, path, body) {
    const base = (proxyUrl || 'http://localhost:8765').replace(/\/$/, '');
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Proxy error ${res.status}`);
    }
    return res.json();
  }

  async function checkGarminProxy(proxyUrl) {
    const data = await proxyGet(proxyUrl, '/health');
    return data.status === 'ok';
  }

  async function garminProxyStatus(proxyUrl) {
    return proxyGet(proxyUrl, '/auth/status');
  }

  async function garminProxyLogin(proxyUrl, username, password) {
    return proxyPost(proxyUrl, '/auth/login', { username, password });
  }

  async function fetchGarminActivities(proxyUrl, onProgress) {
    if (!proxyUrl) throw new Error('No proxy URL set. Run garmin-proxy/server.py and set the URL in Settings.');
    // Resume session first
    const status = await garminProxyStatus(proxyUrl);
    if (!status.authenticated) {
      throw new Error('Not authenticated with Garmin. Use Settings → Garmin → Connect to log in.');
    }
    const allActs = [];
    let start = 0;
    const batchSize = 100;
    while (true) {
      const data = await proxyGet(proxyUrl, `/activities?start=${start}&limit=${batchSize}`);
      const batch = data.activities || [];
      allActs.push(...batch);
      if (onProgress) onProgress(allActs.length);
      if (batch.length < batchSize) break;
      start += batchSize;
    }
    return allActs.sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
  }

  async function fetchGarminActivityDetail(proxyUrl, activityId) {
    return proxyGet(proxyUrl, `/activities/${activityId}`);
  }

  window.ApiService = {
    fetchStravaActivities,
    fetchStravaActivityDetail,
    validateStravaToken,
    getStravaStatus,
    startStravaConnect,
    disconnectStrava,
    hasLocalBackend,
    fetchGarminActivities,
    fetchGarminActivityDetail,
    checkGarminProxy,
    garminProxyStatus,
    garminProxyLogin,
    transformStrava,
  };

})();
