// SettingsView.jsx — Account & API configuration

function SourceCard({ id, label, sub, connected, testing, onTest, children, form, setDataSource, ACCENT, ACCENT_DIM }) {
  const active = form.dataSource === id;
  return (
    <div style={{
      border: `1px solid ${active ? 'rgba(232,104,42,0.35)' : 'rgba(255,255,255,0.07)'}`,
      background: active ? 'rgba(232,104,42,0.05)' : '#141414',
      borderRadius: 12, padding: '18px 20px', marginBottom: 12,
      transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: active ? 18 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setDataSource(id)} style={{
            width: 18, height: 18, borderRadius: '50%', padding: 0,
            border: `2px solid ${active ? ACCENT : '#444'}`,
            background: active ? ACCENT : 'transparent',
            cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}/>}
          </button>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f0ede8' }}>{label}</div>
            <div style={{ fontSize: 12, color: '#555' }}>{sub}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {connected && (
            <span style={{ fontSize: 11, color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '3px 8px', borderRadius: 20, fontWeight: 500 }}>
              ● Connected
            </span>
          )}
          <button onClick={onTest} disabled={testing} style={{
            fontSize: 12, padding: '6px 14px', borderRadius: 8,
            background: active ? ACCENT_DIM : 'rgba(255,255,255,0.06)',
            border: `1px solid ${active ? 'rgba(232,104,42,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: active ? ACCENT : '#888',
            cursor: testing ? 'default' : 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
            {testing ? 'Connecting…' : connected ? 'Reconnect' : 'Connect'}
          </button>
        </div>
      </div>
      {active && children}
    </div>
  );
}

function SettingsView({ settings, onSave, onSync, dataState }) {
  const { ACCENT, ACCENT_DIM, IconSettings, IconHeart, IconActivity } = window;

  const [form, setForm] = React.useState({
    accountName: settings.accountName || 'Alex Runner',
    dataSource: settings.dataSource || 'garmin',
    garminUser: settings.garminUser || '',
    garminPass: settings.garminPass || '',
    stravaClientId: settings.stravaClientId || '',
    stravaToken: settings.stravaToken || '',
    stravaConfigured: settings.stravaConfigured || false,
    stravaDetail: settings.stravaDetail || '',
    garminConnected: settings.garminConnected || false,
    stravaConnected: settings.stravaConnected || false,
  });
  const [showGarminPass, setShowGarminPass] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [testingGarmin, setTestingGarmin] = React.useState(false);
  const [testingStrava, setTestingStrava] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    if (!window.ApiService?.getStravaStatus) return;
    window.ApiService.getStravaStatus().then(status => {
      if (!alive) return;
      set('stravaConfigured', !!status.configured);
      set('stravaConnected', !!status.connected);
      set('stravaDetail', status.detail || '');
      if (status.athlete_name) set('accountName', status.athlete_name);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testConnection = async (source) => {
    if (source === 'garmin') {
      setTestingGarmin(true);
      try {
        const proxyUrl = (form.garminProxyUrl || 'http://localhost:8765').trim();
        const ok = await window.ApiService.checkGarminProxy(proxyUrl);
        if (!ok) throw new Error('Garmin proxy not reachable');
        if (!form.garminUser || !form.garminPass) {
          throw new Error('Enter your Garmin username and password first.');
        }
        const result = await window.ApiService.garminProxyLogin(proxyUrl, form.garminUser, form.garminPass);
        set('garminConnected', !!result.ok);
        if (result.name) set('accountName', result.name);
      } catch (err) {
        set('garminConnected', false);
        alert(err.message || 'Garmin connection failed');
      } finally {
        setTestingGarmin(false);
      }
    } else {
      setTestingStrava(true);
      try {
        const result = await window.ApiService.validateStravaToken();
        set('stravaConnected', true);
        set('stravaConfigured', true);
        set('stravaDetail', 'Connected through the local backend.');
        if (result?.name) set('accountName', result.name);
      } catch (err) {
        set('stravaConnected', false);
        alert(err.message || 'Strava connection failed');
      } finally {
        setTestingStrava(false);
      }
    }
  };

  const liveActivities = dataState?.activities || [];
  const totalDistance = liveActivities.reduce((s, a) => s + a.distance, 0);
  const totalDuration = liveActivities.reduce((s, a) => s + a.duration, 0);

  const S = {
    section: {
      background: '#181818',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14,
      padding: '22px 24px',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 13, fontWeight: 700, color: '#f0ede8',
      letterSpacing: '-0.01em', marginBottom: 4,
    },
    sectionSub: { fontSize: 12, color: '#555', marginBottom: 20 },
    label: { fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' },
    input: {
      width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '9px 12px', color: '#f0ede8', fontSize: 13,
      fontFamily: "'DM Sans', sans-serif", outline: 'none',
    },
    row: { marginBottom: 16 },
    divider: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '20px 0' },
  };

  const setDataSource = (id) => set('dataSource', id);

  return (
    <div style={{ height: '100%', overflowY: 'auto', paddingRight: 4, maxWidth: 640 }}>

      {/* Account */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Account</div>
        <div style={S.sectionSub}>Your profile and display preferences</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: `linear-gradient(135deg, ${ACCENT} 0%, #c45a20 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {(form.accountName || 'A')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Display Name</label>
            <input
              value={form.accountName}
              onChange={e => set('accountName', e.target.value)}
              style={S.input}
              placeholder="Your name"
            />
          </div>
        </div>

        <div style={S.divider}/>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Total Runs', value: liveActivities.length },
            { label: 'Data Since', value: 'Oct 2025' },
            { label: 'Total Distance', value: `${totalDistance.toFixed(0)} km` },
            { label: 'Total Time', value: window.RVR.fmtDuration(totalDuration) },
          ].map(s => (
            <div key={s.label} style={{ background: '#111', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#ccc' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Sources */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Data Sources</div>
        <div style={S.sectionSub}>Garmin Connect is the primary source. Strava can be used as a fallback.</div>

        {/* Garmin */}
        <SourceCard
          id="garmin"
          label="Garmin Connect"
          sub="Primary · via local proxy"
          connected={form.garminConnected}
          testing={testingGarmin}
          form={form}
          setDataSource={setDataSource}
          ACCENT={ACCENT}
          ACCENT_DIM={ACCENT_DIM}
          onTest={async () => {
            setTestingGarmin(true);
            try {
              const proxyUrl = form.garminProxyUrl || 'http://localhost:8765';
              // Check proxy is running
              await window.ApiService.checkGarminProxy(proxyUrl);
              // Attempt login
              const result = await window.ApiService.garminProxyLogin(proxyUrl, form.garminUser, form.garminPass);
              if (result.ok) {
                set('garminConnected', true);
                set('accountName', result.name || form.accountName);
              }
            } catch (err) {
              alert(`Connection failed: ${err.message}`);
            } finally {
              setTestingGarmin(false);
            }
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Proxy URL</label>
            <input
              value={form.garminProxyUrl || 'http://localhost:8765'}
              onChange={e => set('garminProxyUrl', e.target.value)}
              style={S.input}
              placeholder="http://localhost:8765"
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <div style={{ fontSize: 11, color: '#444' }}>
                Run <code style={{ background: '#1a1a1a', padding: '1px 5px', borderRadius: 3, color: '#888' }}>python server.py</code> to start the proxy
              </div>
              <button onClick={async () => {
                if (!window.JSZip || !window.PROXY_FILES) return;
                const zip = new window.JSZip();
                const folder = zip.folder('garmin-proxy');
                Object.entries(window.PROXY_FILES).forEach(([name, content]) => folder.file(name, content));
                const blob = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'garmin-proxy.zip'; a.click();
                URL.revokeObjectURL(url);
              }} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                background: ACCENT_DIM, border: `1px solid rgba(232,104,42,0.25)`,
                color: ACCENT, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                ↓ Download Proxy
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>Garmin Username</label>
              <input
                value={form.garminUser}
                onChange={e => set('garminUser', e.target.value)}
                style={S.input}
                placeholder="email@example.com"
                autoComplete="off"
              />
            </div>
            <div>
              <label style={S.label}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showGarminPass ? 'text' : 'password'}
                  value={form.garminPass}
                  onChange={e => set('garminPass', e.target.value)}
                  style={{ ...S.input, paddingRight: 40 }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button onClick={() => setShowGarminPass(v => !v)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 11,
                }}>{showGarminPass ? 'Hide' : 'Show'}</button>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: '#444', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🔒</span> Credentials go to your local proxy only — never to RunViewR servers.
          </div>
        </SourceCard>
        {/* Strava */}
        <SourceCard
          id="strava"
          label="Strava"
          sub="Recommended · automatic local OAuth"
          connected={form.stravaConnected}
          testing={testingStrava}
          form={form}
          setDataSource={setDataSource}
          ACCENT={ACCENT}
          ACCENT_DIM={ACCENT_DIM}
          onTest={async () => {
            setTestingStrava(true);
            try {
              if (!window.ApiService?.hasLocalBackend || !window.ApiService.hasLocalBackend()) {
                throw new Error('Open RunViewR through http://localhost:8000/RunViewR.html so the local backend can handle Strava login.');
              }
              const status = await window.ApiService.getStravaStatus();
              if (!status.configured) throw new Error(status.detail || 'Create a .env file with your Strava client ID and client secret first.');
              if (status.connected) {
                const result = await window.ApiService.validateStravaToken();
                set('stravaConnected', true);
                set('stravaDetail', 'Connected through the local backend.');
                if (result?.name) set('accountName', result.name);
              } else {
                await window.ApiService.startStravaConnect();
              }
            } catch (err) {
              set('stravaConnected', false);
              set('stravaDetail', err.message || 'Strava connection failed');
              alert(err.message || 'Strava connection failed');
            } finally {
              setTestingStrava(false);
            }
          }}
        >
          <div style={{ fontSize: 12, color: '#ccc', lineHeight: 1.6 }}>
            This version uses a tiny local backend so you only set your Strava client ID and client secret once in <code style={{ background: '#1a1a1a', padding: '1px 5px', borderRadius: 3, color: '#bbb' }}>.env</code>.
          </div>
          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Backend status</div>
              <div style={{ fontSize: 13, color: form.stravaConfigured ? '#ccc' : '#f87171' }}>{form.stravaConfigured ? 'Configured' : 'Not configured yet'}</div>
              {form.stravaDetail && <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{form.stravaDetail}</div>}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => window.ApiService.startStravaConnect()} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: ACCENT_DIM, border: '1px solid rgba(232,104,42,0.25)', color: ACCENT, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Connect with Strava</button>
              <button onClick={async () => { await window.ApiService.disconnectStrava(); set('stravaConnected', false); set('stravaDetail', 'Disconnected.'); }} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#aaa', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Disconnect</button>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: '#555', lineHeight: 1.55 }}>
            No more manual code exchange in PowerShell. The backend stores your refresh token locally in <code style={{ background: '#1a1a1a', padding: '1px 5px', borderRadius: 3, color: '#888' }}>tokens.json</code> and refreshes access automatically.
          </div>
        </SourceCard>

        <div style={{ fontSize: 12, color: '#444', marginTop: 8 }}>
          Active source: <strong style={{ color: '#888' }}>{form.dataSource === 'garmin' ? 'Garmin Connect' : 'Strava'}</strong>
          {form.dataSource === 'garmin' && !form.garminConnected && ' · not connected, no data loaded'}
          {form.dataSource === 'strava' && !form.stravaConnected && ' · not connected, no data loaded'}
        </div>
      </div>

      {/* Sync */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Sync</div>
        <div style={S.sectionSub}>Saves settings then fetches live activity data from your selected source</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => { onSave(form); onSync(form); }}
            disabled={dataState?.status === 'loading'}
            style={{
              padding: '9px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: dataState?.status === 'loading' ? 'rgba(255,255,255,0.05)'
                : dataState?.status === 'live' ? 'rgba(74,222,128,0.15)'
                : dataState?.status === 'error' ? 'rgba(248,113,113,0.1)'
                : ACCENT,
              border: `1px solid ${
                dataState?.status === 'live' ? 'rgba(74,222,128,0.3)'
                : dataState?.status === 'error' ? 'rgba(248,113,113,0.25)'
                : dataState?.status === 'loading' ? 'rgba(255,255,255,0.08)'
                : 'transparent'}`,
              color: dataState?.status === 'loading' ? '#555'
                : dataState?.status === 'live' ? '#4ade80'
                : dataState?.status === 'error' ? '#f87171'
                : '#fff',
              cursor: dataState?.status === 'loading' ? 'default' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.25s',
            }}>
            {dataState?.status === 'loading'
              ? <><span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>↻</span> Syncing{dataState.progress > 0 ? ` · ${dataState.progress} activities` : '…'}</>
              : dataState?.status === 'live'
              ? <>✓ Synced · {dataState.activities?.length} activities — Sync again</>
              : dataState?.status === 'error'
              ? <>↻ Retry Sync</>
              : <>↻ Sync Now</>}
          </button>
          {dataState?.status === 'error' && (
            <span style={{ fontSize: 12, color: '#f87171', maxWidth: 340, lineHeight: 1.4 }}>⚠ {dataState.error}</span>
          )}
        </div>
        {form.dataSource === 'strava' && !form.stravaConnected && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#f87171' }}>⚠ Strava is not connected yet — click Connect with Strava in the card above.</div>
        )}
        {form.dataSource === 'garmin' && !form.garminConnected && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#f87171' }}>⚠ Garmin not connected — click Connect on the Garmin card above first.</div>
        )}
        {(!dataState || dataState.status === 'sample') && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#555' }}>No data loaded yet. Connect an account above and click Sync Now to import your activities.</div>
        )}
      </div>

      {/* Setup instructions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ ...S.section, background: '#111', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 10 }}>Strava Local OAuth</div>
          {[
            '1. Put your Strava client ID and client secret into .env',
            '2. Start RunViewR with start-runviewr.bat',
            '3. Open Settings in the app',
            '4. Click Connect with Strava',
            '5. Authorize in your browser',
            '6. Come back and click Sync Now',
          ].map((step, i) => (
            <div key={i} style={{ fontSize: 11, color: '#555', marginBottom: 4, lineHeight: 1.5 }}>{step}</div>
          ))}
          <a href="https://developers.strava.com/docs/authentication/" target="_blank" rel="noreferrer"
            style={{ fontSize: 11, color: ACCENT, textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>
            Strava OAuth docs →
          </a>
        </div>
      </div>

      {/* Save button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button onClick={handleSave} style={{
          padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: saved ? 'rgba(74,222,128,0.15)' : ACCENT,
          border: `1px solid ${saved ? 'rgba(74,222,128,0.3)' : 'transparent'}`,
          color: saved ? '#4ade80' : '#fff',
          cursor: 'pointer', transition: 'all 0.2s',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>

      <div style={{ height: 32 }}/>
    </div>
  );
}

Object.assign(window, { SettingsView });
