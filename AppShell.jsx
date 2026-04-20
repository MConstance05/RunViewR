// AppShell.jsx — Sidebar, routing, tweaks, root render

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#e8682a",
  "unit": "km",
  "showHR": true,
  "theme": "dark"
}/*EDITMODE-END*/;

function App() {
  const [view, setView] = React.useState(() => localStorage.getItem('rvr_view') || 'dashboard');
  const [selectedActivity, setSelectedActivity] = React.useState(null);
  const [tweaksOpen, setTweaksOpen] = React.useState(false);

  // Live data state
  const [dataState, setDataState] = React.useState({ status: 'idle', activities: [], error: null, progress: 0 });
  const activities = dataState.activities ?? window.RVR.activities;

  const syncData = React.useCallback(async (settings) => {
    const s = settings || appSettings;
    const token = (s.stravaToken || '').trim();
    const source = s.dataSource;
    const canUseLocalStrava = window.ApiService?.hasLocalBackend && window.ApiService.hasLocalBackend();
    if (source === 'strava' && (token || canUseLocalStrava)) {
      setDataState(d => ({ ...d, status: 'loading', error: null, progress: 0 }));
      try {
        await window.ApiService.validateStravaToken(token);
        const acts = await window.ApiService.fetchStravaActivities(token, (n) => {
          setDataState(d => ({ ...d, progress: n }));
        });
        // Rebuild byDate index
        const byDate = {};
        acts.forEach(a => { if (!byDate[a.date]) byDate[a.date] = []; byDate[a.date].push(a); });
        window.RVR_LIVE = { activities: acts, byDate };
        setDataState({ status: 'live', activities: acts, error: null, progress: acts.length });
      } catch (err) {
        setDataState({ status: 'error', activities: null, error: err.message, progress: 0 });
      }
    } else if (source === 'garmin') {
      const proxyUrl = s.garminProxyUrl || 'http://localhost:8765';
      setDataState(d => ({ ...d, status: 'loading', error: null, progress: 0 }));
      try {
        const acts = await window.ApiService.fetchGarminActivities(proxyUrl, (n) => {
          setDataState(d => ({ ...d, progress: n }));
        });
        const byDate = {};
        acts.forEach(a => { if (!byDate[a.date]) byDate[a.date] = []; byDate[a.date].push(a); });
        window.RVR_LIVE = { activities: acts, byDate };
        setDataState({ status: 'live', activities: acts, error: null, progress: acts.length });
      } catch (err) {
        setDataState({ status: 'error', activities: null, error: err.message, progress: 0 });
      }
    }
  }, []);
  const [appSettings, setAppSettings] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('rvr_settings') || '{}'); }
    catch { return {}; }
  });

  const handleSaveSettings = (s) => {
    setAppSettings(s);
    localStorage.setItem('rvr_settings', JSON.stringify(s));
  };

  const handleSyncNow = (formOverride) => syncData(formOverride || appSettings);

  const activeSourceLabel = appSettings.dataSource === 'garmin' ? 'Garmin' : 'Strava';
  const activeConnected = appSettings.dataSource === 'garmin' ? !!appSettings.garminConnected : !!appSettings.stravaConnected;
  const [tweaks, setTweaks] = React.useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('rvr_tweaks') || '{}');
      return { ...TWEAK_DEFAULTS, ...stored };
    } catch { return TWEAK_DEFAULTS; }
  });

  // Tweaks edit-mode bridge
  React.useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  // Auto-sync on load if token present
  React.useEffect(() => {
    const s = appSettings;
    if (s.dataSource === 'strava' && window.ApiService?.hasLocalBackend && window.ApiService.hasLocalBackend()) syncData(s);
  }, []);

  const applyTweak = (key, val) => {
    const next = { ...tweaks, [key]: val };
    setTweaks(next);
    localStorage.setItem('rvr_tweaks', JSON.stringify(next));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*');
  };

  const navigate = (v) => {
    setView(v);
    setSelectedActivity(null);
    localStorage.setItem('rvr_view', v);
  };

  const handleSelectActivity = (a) => {
    setSelectedActivity(a);
    setView('activity-detail');
    localStorage.setItem('rvr_view', 'activity-detail');
  };

  const accent = tweaks.accent || TWEAK_DEFAULTS.accent;
  const isDark = tweaks.theme !== 'light';
  const bg = isDark ? '#0b0b0b' : '#f4f3f0';
  const surface = isDark ? '#141414' : '#ffffff';
  const sidebar = isDark ? '#111111' : '#fafaf8';
  const textPrimary = isDark ? '#f0ede8' : '#1a1a1a';
  const textSub = isDark ? '#888' : '#888';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';

  const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: <window.IconHome size={16}/> },
    { id: 'activities', label: 'Activities', icon: <window.IconActivity size={16}/> },
    { id: 'calendar', label: 'Calendar', icon: <window.IconCalendar size={16}/> },
    { id: 'settings', label: 'Settings', icon: <window.IconSettings size={16}/> },
  ];

  const viewTitle = {
    dashboard: 'Dashboard',
    activities: 'All Activities',
    calendar: 'Calendar',
    'activity-detail': selectedActivity?.title || 'Activity',
    settings: 'Settings',
  }[view] || 'RunViewR';

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '220px 1fr', height: '100vh',
      background: bg, color: textPrimary, fontFamily: "'DM Sans', sans-serif",
      '--accent': accent,
    }}>

      {/* ── Sidebar ── */}
      <aside style={{
        background: sidebar,
        borderRight: `1px solid ${border}`,
        display: 'flex', flexDirection: 'column',
        padding: '0 0 16px 0',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '22px 20px 16px', borderBottom: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <window.IconRun size={16} color="#fff"/>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: textPrimary, letterSpacing: '-0.03em' }}>RunViewR</span>
          </div>
        </div>

        {/* User */}
        <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: `linear-gradient(135deg, ${accent} 0%, #c45a20 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
            }}>A</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{appSettings.accountName || 'Alex Runner'}</div>
              <div style={{ fontSize: 11, color: textSub }}>{activeSourceLabel} · {activeConnected ? 'Connected' : 'Not connected'}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          <div style={{ fontSize: 10, color: isDark ? '#444' : '#bbb', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 10px', marginBottom: 6 }}>Navigation</div>
          {NAV.map(item => {
            const active = view === item.id || (view === 'activity-detail' && item.id === 'activities');
            return (
              <button key={item.id} onClick={() => navigate(item.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 12px', borderRadius: 8,
                background: active ? (isDark ? 'rgba(232,104,42,0.12)' : 'rgba(232,104,42,0.1)') : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                color: active ? accent : textSub,
                fontSize: 13, fontWeight: active ? 600 : 400,
                marginBottom: 2, transition: 'all 0.13s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                {item.icon}
                {item.label}
                {active && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: accent }}/>}
              </button>
            );
          })}
        </nav>

        {/* Bottom: total stats */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${border}`, fontSize: 12 }}>
          <div style={{ color: isDark ? '#444' : '#bbb', marginBottom: 8, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>All Time</div>
          {[
            { label: 'Runs', value: activities.length },
            { label: 'Distance', value: tweaks.unit === 'mi'
              ? `${(activities.reduce((s,a)=>s+a.distance,0)*0.621371).toFixed(0)} mi`
              : `${activities.reduce((s,a)=>s+a.distance,0).toFixed(0)} km` },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', color: textSub, marginBottom: 4 }}>
              <span>{s.label}</span>
              <span style={{ color: textPrimary, fontWeight: 500 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '18px 28px 16px',
          borderBottom: `1px solid ${border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: textPrimary, letterSpacing: '-0.02em' }}>{viewTitle}</h1>
            <div style={{ fontSize: 12, color: textSub, marginTop: 1 }}>
              {new Date('2026-04-19').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Source badge */}
            <div style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 20,
              background: 'rgba(252,82,0,0.12)', color: '#fc5200', fontWeight: 600,
              border: '1px solid rgba(252,82,0,0.2)',
            }}>{"● "}{activeSourceLabel}</div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '20px 28px' }}>
          {/* Data status banner */}
          {dataState.status === 'loading' && (
            <div style={{ background: 'rgba(232,104,42,0.1)', border: '1px solid rgba(232,104,42,0.2)', borderRadius: 8, padding: '8px 14px', marginBottom: 14, fontSize: 12, color: ACCENT, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</span>
              Fetching live activities… {dataState.progress > 0 ? `${dataState.progress} loaded` : ''}
            </div>
          )}
          {dataState.status === 'error' && (
            <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '8px 14px', marginBottom: 14, fontSize: 12, color: '#f87171', display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
              <span>⚠ {dataState.error}</span>
              <span style={{ color: '#666' }}>{activities.length ? 'Using last loaded data' : 'No data loaded'}</span>
            </div>
          )}
          {dataState.status === 'idle' && activities.length === 0 && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 14px', marginBottom: 14, fontSize: 12, color: '#aaa' }}>
              No data loaded yet. Connect an account and click Sync Now to import your activities.
            </div>
          )}
          {dataState.status === 'live' && (
            <div style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.18)', borderRadius: 8, padding: '6px 14px', marginBottom: 14, fontSize: 12, color: '#4ade80', display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
              <span>● Live {activeSourceLabel} data · {activities.length} activities</span>
              <button onClick={handleSyncNow} style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontSize: 12, opacity: 0.7 }}>Refresh ↻</button>
            </div>
          )}
          {view === 'dashboard' && (
            <window.Dashboard
              onSelectActivity={handleSelectActivity}
              onNavigate={navigate}
              unit={tweaks.unit}
              activities={activities}
            />
          )}
          {(view === 'activities' || view === 'activity-detail') && (
            <window.ActivitiesView
              onSelectActivity={handleSelectActivity}
              unit={tweaks.unit}
              initialActivity={view === 'activity-detail' ? selectedActivity : null}
              activities={activities}
            />
          )}
          {view === 'calendar' && (
            <window.CalendarView
              onSelectActivity={handleSelectActivity}
              unit={tweaks.unit}
              activities={activities}
            />
          )}
          {view === 'settings' && (
            <window.SettingsView
              settings={appSettings}
              onSave={handleSaveSettings}
              onSync={handleSyncNow}
              dataState={dataState}
            />
          )}
        </div>
      </main>

      {/* ── Tweaks Panel ── */}
      {tweaksOpen && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
          background: isDark ? '#1e1e1e' : '#fff',
          border: `1px solid ${border}`,
          borderRadius: 14, padding: '18px 20px', width: 240,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 16 }}>Tweaks</div>

          <TweakRow label="Accent color">
            <div style={{ display: 'flex', gap: 6 }}>
              {['#e8682a', '#3b82f6', '#10b981', '#a855f7'].map(c => (
                <button key={c} onClick={() => applyTweak('accent', c)} style={{
                  width: 22, height: 22, borderRadius: '50%', background: c, border: tweaks.accent === c ? `2px solid ${textPrimary}` : '2px solid transparent',
                  cursor: 'pointer',
                }}/>
              ))}
            </div>
          </TweakRow>

          <TweakRow label="Distance unit">
            <div style={{ display: 'flex', gap: 6 }}>
              {['km', 'mi'].map(u => (
                <button key={u} onClick={() => applyTweak('unit', u)} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 12,
                  background: tweaks.unit === u ? accent : 'rgba(255,255,255,0.08)',
                  color: tweaks.unit === u ? '#fff' : textSub,
                  border: 'none', cursor: 'pointer', fontWeight: tweaks.unit === u ? 600 : 400,
                }}>{u}</button>
              ))}
            </div>
          </TweakRow>

          <TweakRow label="Theme">
            <div style={{ display: 'flex', gap: 6 }}>
              {['dark', 'light'].map(t => (
                <button key={t} onClick={() => applyTweak('theme', t)} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 12, textTransform: 'capitalize',
                  background: tweaks.theme === t ? accent : 'rgba(255,255,255,0.08)',
                  color: tweaks.theme === t ? '#fff' : textSub,
                  border: 'none', cursor: 'pointer', fontWeight: tweaks.theme === t ? 600 : 400,
                }}>{t}</button>
              ))}
            </div>
          </TweakRow>
        </div>
      )}
    </div>
  );
}

function TweakRow({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>{label}</div>
      {children}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
