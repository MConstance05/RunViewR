// ActivitiesView.jsx — Activity list + detail panel

function ActivityDetail({ activity, onBack, unit }) {
  const { fmtDuration } = window.RVR;
  const { RouteMap, ElevationChart, SplitsChart, PaceChart, HRChart, TypeBadge, IconMapPin, IconHeart, IconChevron, ACCENT } = window;
  if (!activity) return null;

  const fmtDist = (km) => unit === 'mi' ? `${(km * 0.621371).toFixed(2)} mi` : `${km.toFixed(2)} km`;
  const pace = unit === 'mi' ? window.RVR.fmtPace(activity.paceSec / 0.621371) : activity.pace;
  const paceLabel = unit === 'mi' ? '/mi' : '/km';

  const dateStr = new Date(activity.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const heroStats = [
    { label: 'Distance', value: fmtDist(activity.distance) },
    { label: 'Time', value: fmtDuration(activity.duration) },
    { label: 'Avg Pace', value: `${pace}${paceLabel}` },
    { label: 'Elevation', value: `+${activity.elevationGain} m` },
  ];
  const subStats = [
    { label: 'Calories', value: `${activity.calories} kcal` },
    { label: 'Cadence', value: `${activity.cadence} spm` },
    { label: 'Avg HR', value: `${activity.heartRate.avg} bpm`, highlight: true },
    { label: 'Max HR', value: `${activity.heartRate.max} bpm` },
  ];

  // HR zone label
  const hrAvg = activity.heartRate.avg;
  const hrZone = hrAvg >= 170 ? { label: 'Zone 5 — Max', color: '#f87171' }
    : hrAvg >= 160 ? { label: 'Zone 4 — Threshold', color: '#fb923c' }
    : hrAvg >= 150 ? { label: 'Zone 3 — Aerobic', color: ACCENT }
    : hrAvg >= 140 ? { label: 'Zone 2 — Easy', color: '#facc15' }
    : { label: 'Zone 1 — Recovery', color: '#4ade80' };

  const ChartCard = ({ title, children, extra }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <SectionLabel>{title}</SectionLabel>
        {extra}
      </div>
      <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px 12px' }}>
        {children}
      </div>
    </div>
  );

  return (
    <div style={{ height: '100%', overflowY: 'auto', paddingRight: 4 }}>
      {/* Back + badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 12px',
          color: '#aaa', fontSize: 12, cursor: 'pointer',
        }}>
          <IconChevron dir="left" size={14} color="#aaa" /> Back
        </button>
        <TypeBadge type={activity.type} />
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f0ede8', letterSpacing: '-0.03em', marginBottom: 4 }}>
        {activity.title}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#666', fontSize: 13, marginBottom: 22, flexWrap: 'wrap' }}>
        <span>{dateStr} · {activity.startTime}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <IconMapPin size={13} color="#555" /> {activity.location}
        </span>
      </div>

      {/* Hero stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
        {heroStats.map(s => (
          <div key={s.label} style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#f0ede8', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {subStats.map(s => (
          <div key={s.label} style={{
            background: s.highlight ? 'rgba(232,104,42,0.07)' : '#141414',
            border: `1px solid ${s.highlight ? 'rgba(232,104,42,0.2)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 10, padding: '12px 14px',
          }}>
            <div style={{ fontSize: 10, color: s.highlight ? 'rgba(232,104,42,0.7)' : '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: s.highlight ? ACCENT : '#ccc', letterSpacing: '-0.01em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Route map */}
      <ChartCard title="Route">
        <RouteMap activity={activity} />
      </ChartCard>

      {/* Pace graph */}
      <ChartCard title="Pace"
        extra={<span style={{ fontSize: 12, color: '#555' }}>Avg {pace}{paceLabel}</span>}>
        <PaceChart paceProfile={activity.paceProfile} avgPaceSec={activity.paceSec} uid={`pace${activity.id}`} />
      </ChartCard>

      {/* Heart rate graph */}
      <ChartCard title="Heart Rate"
        extra={
          <span style={{ fontSize: 11, background: `${hrZone.color}22`, color: hrZone.color, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>
            {hrZone.label}
          </span>
        }>
        <HRChart
          hrProfile={activity.hrProfile}
          avgHR={activity.heartRate.avg}
          maxHR={activity.heartRate.max}
          uid={`hr${activity.id}`}
        />
      </ChartCard>

      {/* Elevation */}
      <ChartCard title="Elevation"
        extra={<span style={{ fontSize: 12, color: '#555' }}>+{activity.elevationGain}m gain</span>}>
        <ElevationChart data={activity.elevationProfile} height={90} uid={`det${activity.id}`} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: '#444' }}>Start</span>
          <span style={{ fontSize: 11, color: '#444' }}>Finish</span>
        </div>
      </ChartCard>

      {/* Splits */}
      <ChartCard title="Kilometer Splits">
        <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 54px', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {['Split', 'Pace bar', 'Pace'].map(h => (
            <span key={h} style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: h === 'Pace' ? 'right' : 'left' }}>{h}</span>
          ))}
        </div>
        <SplitsChart splits={activity.splits} avgPaceSec={activity.paceSec} />
      </ChartCard>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <h3 style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
      {children}
    </h3>
  );
}

// ── Activities list view ──────────────────────────────────────────────────────
function ActivitiesView({ onSelectActivity, unit, initialActivity, activities: propActivities }) {
  const activities = propActivities || window.RVR.activities;
  const { ActivityRow, ACCENT, ACCENT_DIM } = window;
  const [filter, setFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState(initialActivity || null);

  React.useEffect(() => { if (initialActivity) setSelected(initialActivity); }, [initialActivity?.id]);

  const filtered = React.useMemo(() => {
    let list = activities;
    if (filter !== 'all') list = list.filter(a => a.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.date.includes(q)
      );
    }
    return list;
  }, [filter, search]);

  const handleSelect = (a) => {
    setSelected(a);
    onSelectActivity(a);
  };

  if (selected) {
    return (
      <ActivityDetail
        activity={selected}
        onBack={() => setSelected(null)}
        unit={unit}
      />
    );
  }

  const totalDist = filtered.reduce((s, a) => s + a.distance, 0);
  const { fmtDuration } = window.RVR;

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'long', label: 'Long' },
    { key: 'tempo', label: 'Tempo' },
    { key: 'easy', label: 'Easy' },
    { key: 'recovery', label: 'Recovery' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexShrink: 0 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search runs…"
          style={{
            flex: 1, background: '#181818', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '8px 14px', color: '#f0ede8', fontSize: 13,
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 4 }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
              background: filter === f.key ? ACCENT_DIM : 'rgba(255,255,255,0.05)',
              border: `1px solid ${filter === f.key ? 'rgba(232,104,42,0.3)' : 'transparent'}`,
              color: filter === f.key ? ACCENT : '#888',
              cursor: 'pointer',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 14, flexShrink: 0 }}>
        {[
          { label: 'Activities', value: filtered.length },
          { label: 'Distance', value: unit === 'mi' ? `${(totalDist * 0.621371).toFixed(1)} mi` : `${totalDist.toFixed(1)} km` },
          { label: 'Time', value: fmtDuration(filtered.reduce((s, a) => s + a.duration, 0)) },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#f0ede8', letterSpacing: '-0.02em' }}>{s.value}</span>
            <span style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 2, paddingRight: 4 }}>
        {filtered.length === 0 ? (
          <div style={{ color: '#666', fontSize: 14, textAlign: 'center', paddingTop: 40, lineHeight: 1.6 }}>
            {activities.length === 0 ? 'No activity data yet. Connect an account and sync to import your runs.' : 'No activities match your filter.'}
          </div>
        ) : filtered.map(a => (
          <ActivityRow key={a.id} activity={a} selected={false} onClick={() => handleSelect(a)} unit={unit} />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ActivityDetail, ActivitiesView, SectionLabel });
