// AppComponents.jsx — shared UI primitives
// Exported to window for use across all view files

const ACCENT = 'oklch(72% 0.17 42)';
const ACCENT_DIM = 'rgba(232,104,42,0.13)';
const TYPE_COLORS = {
  long: { bg: 'rgba(99,179,237,0.12)', text: '#63b3ed', label: 'Long' },
  tempo: { bg: 'rgba(252,129,74,0.12)', text: '#fc814a', label: 'Tempo' },
  recovery: { bg: 'rgba(110,231,183,0.10)', text: '#6ee7b7', label: 'Recovery' },
  easy: { bg: 'rgba(255,255,255,0.06)', text: '#aaa', label: 'Easy' },
};

// ── Icons ────────────────────────────────────────────────────────────────────
function IconHome({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function IconActivity({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}
function IconCalendar({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function IconChevron({ dir = 'right', size = 16, color = 'currentColor' }) {
  const rot = { right: 0, left: 180, down: 90, up: -90 }[dir];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${rot}deg)` }}>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
function IconMapPin({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
function IconHeart({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}
function IconZap({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}
function IconSettings({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}
function IconRun({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="4" r="2"/><path d="M7 22l2-7 3 3 2-8"/><path d="M17.5 22l-3-9-2.5 2.5"/><path d="M6 14l2-5 3 1 3-3"/>
    </svg>
  );
}

// ── Elevation Chart ──────────────────────────────────────────────────────────
function ElevationChart({ data, width = 400, height = 72, uid = 'e0', color = ACCENT }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 4;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - pad - ((v - min) / range) * (height - pad * 2),
  }));
  let line = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp1x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * 0.4;
    const cp2x = pts[i].x - (pts[i].x - pts[i - 1].x) * 0.4;
    line += ` C ${cp1x} ${pts[i-1].y} ${cp2x} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
  }
  const fill = `${line} L ${width} ${height} L 0 ${height} Z`;
  const gid = `eg${uid}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gid})`}/>
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Mini sparkline for activity cards ────────────────────────────────────────
function MiniSparkline({ data, height = 28, color = ACCENT, uid = 's0' }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const w = 80;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    height - 2 - ((v - min) / range) * (height - 4),
  ]);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const fill = `${d} L ${w} ${height} L 0 ${height} Z`;
  const gid = `sg${uid}`;
  return (
    <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gid})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ── Generic Line/Area Chart ──────────────────────────────────────────────────
function LineChart({ data, height = 100, color = ACCENT, uid = 'lc0', invertY = false,
  labelLeft = '', labelRight = '', unit = '', formatVal, minVal, maxVal, showGrid = true }) {
  if (!data || data.length < 2) return null;
  const W = 600, H = height, PAD = { t: 8, b: 24, l: 44, r: 12 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const dMin = minVal !== undefined ? minVal : Math.min(...data);
  const dMax = maxVal !== undefined ? maxVal : Math.max(...data);
  const range = dMax - dMin || 1;

  const sx = (i) => PAD.l + (i / (data.length - 1)) * innerW;
  const sy = (v) => {
    const norm = (v - dMin) / range;
    return PAD.t + (invertY ? norm : 1 - norm) * innerH;
  };

  let linePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`).join(' ');
  // Smooth with catmull-rom style
  let smoothPath = `M ${sx(0).toFixed(1)} ${sy(data[0]).toFixed(1)}`;
  for (let i = 1; i < data.length; i++) {
    const x0 = sx(i - 1), y0 = sy(data[i - 1]);
    const x1 = sx(i), y1 = sy(data[i]);
    const cpx = (x0 + x1) / 2;
    smoothPath += ` C ${cpx.toFixed(1)} ${y0.toFixed(1)} ${cpx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  const fillPath = `${smoothPath} L ${sx(data.length - 1).toFixed(1)} ${PAD.t + innerH} L ${PAD.l} ${PAD.t + innerH} Z`;

  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => dMin + (range / ticks) * (invertY ? i : ticks - i));
  const fmt = formatVal || ((v) => Math.round(v));
  const gid = `lcg${uid}`;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      {/* Grid lines + y-axis labels */}
      {showGrid && tickVals.map((tv, i) => {
        const y = PAD.t + (i / ticks) * innerH;
        return (
          <g key={i}>
            <line x1={PAD.l} y1={y} x2={PAD.l + innerW} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
            <text x={PAD.l - 6} y={y + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)" fontFamily="DM Sans, sans-serif">
              {fmt(tv)}
            </text>
          </g>
        );
      })}
      {/* X axis line */}
      <line x1={PAD.l} y1={PAD.t + innerH} x2={PAD.l + innerW} y2={PAD.t + innerH} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      {/* X labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <text key={i} x={PAD.l + t * innerW} y={H - 4} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.25)" fontFamily="DM Sans, sans-serif">
          {labelLeft && i === 0 ? labelLeft : labelRight && i === 4 ? labelRight : ''}
        </text>
      ))}
      {/* Fill + line */}
      <path d={fillPath} fill={`url(#${gid})`}/>
      <path d={smoothPath} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Pace Chart (inverted: lower paceSec = faster = higher on chart) ──────────
function PaceChart({ paceProfile, avgPaceSec, uid = 'pc0' }) {
  const { fmtPace } = window.RVR;
  if (!paceProfile || paceProfile.length < 2) return null;
  const min = Math.min(...paceProfile);
  const max = Math.max(...paceProfile);
  const pad = 15;
  return (
    <div>
      <LineChart
        data={paceProfile}
        height={110}
        color={ACCENT}
        uid={uid}
        invertY={true}
        minVal={min - pad}
        maxVal={max + pad}
        labelLeft="Start"
        labelRight="Finish"
        formatVal={(v) => fmtPace(v)}
        unit="/km"
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 11, color: '#4ade80' }}>⬤ Fastest {fmtPace(min)}/km</span>
        <span style={{ fontSize: 11, color: '#888' }}>Avg {fmtPace(avgPaceSec)}/km</span>
        <span style={{ fontSize: 11, color: '#666' }}>Slowest {fmtPace(max)}/km</span>
      </div>
    </div>
  );
}

// ── HR Chart ─────────────────────────────────────────────────────────────────
function HRChart({ hrProfile, avgHR, maxHR, uid = 'hc0' }) {
  if (!hrProfile || hrProfile.length < 2) return null;
  const dataMin = Math.min(...hrProfile);
  const dataMax = Math.max(...hrProfile);
  // Color zones
  const zoneColor = avgHR > 165 ? '#f87171' : avgHR > 155 ? '#fb923c' : avgHR > 145 ? ACCENT : '#facc15';
  return (
    <div>
      <LineChart
        data={hrProfile}
        height={110}
        color={zoneColor}
        uid={uid}
        minVal={Math.max(80, dataMin - 10)}
        maxVal={dataMax + 8}
        labelLeft="Start"
        labelRight="Finish"
        formatVal={(v) => `${Math.round(v)}`}
        unit="bpm"
      />
      <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
        <span style={{ fontSize: 11, color: zoneColor }}>⬤ Avg {avgHR} bpm</span>
        <span style={{ fontSize: 11, color: '#f87171' }}>Max {maxHR} bpm</span>
        <span style={{ fontSize: 11, color: '#555' }}>Min {dataMin} bpm</span>
      </div>
    </div>
  );
}

// ── Route Map Placeholder ────────────────────────────────────────────────────
function RouteMap({ activity }) {
  const pts = activity.routePoints || [[40,100],[100,80],[160,110],[220,70],[300,90],[360,60],[400,80]];
  let d = '';
  pts.forEach((p, i) => {
    if (i === 0) { d = `M ${p[0]} ${p[1]}`; return; }
    const prev = pts[i - 1];
    const cp1x = prev[0] + (p[0] - prev[0]) * 0.45;
    const cp2x = p[0] - (p[0] - prev[0]) * 0.45;
    d += ` C ${cp1x} ${prev[1]} ${cp2x} ${p[1]} ${p[0]} ${p[1]}`;
  });
  const last = pts[pts.length - 1];
  const first = pts[0];
  return (
    <div style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
      <svg width="100%" height="180" viewBox="0 0 440 180" preserveAspectRatio="xMidYMid meet">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 22} x2="440" y2={i * 22} stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="180" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
        ))}
        <path d={d} fill="none" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
        <circle cx={first[0]} cy={first[1]} r="5" fill="#4ade80"/>
        <circle cx={last[0]} cy={last[1]} r="5" fill={ACCENT}/>
        <circle cx={first[0]} cy={first[1]} r="9" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.4"/>
      </svg>
      <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
        Route map — GPX import available
      </div>
    </div>
  );
}

// ── Splits Chart ─────────────────────────────────────────────────────────────
function SplitsChart({ splits, avgPaceSec }) {
  if (!splits || splits.length === 0) return null;
  const maxPace = Math.max(...splits.map(s => s.paceSec));
  const { fmtPace } = window.RVR;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {splits.map((split, i) => {
        const pct = (split.paceSec / maxPace) * 100;
        const isFast = split.paceSec < avgPaceSec;
        const barColor = isFast ? '#4ade80' : ACCENT;
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 54px', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#666', fontVariantNumeric: 'tabular-nums' }}>
              {split.km < 10 ? `KM ${split.km}` : `KM${split.km}`}
            </span>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 3, opacity: isFast ? 0.9 : 0.7 }}/>
            </div>
            <span style={{ fontSize: 12, color: isFast ? '#4ade80' : '#aaa', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {fmtPace(split.paceSec)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = false, large = false }) {
  return (
    <div style={{
      background: accent ? ACCENT_DIM : '#181818',
      border: `1px solid ${accent ? 'rgba(232,104,42,0.25)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 12,
      padding: large ? '20px 24px' : '16px 20px',
    }}>
      <div style={{ fontSize: 11, color: accent ? 'rgba(232,104,42,0.8)' : '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: large ? 32 : 24, fontWeight: 600, color: accent ? ACCENT : '#f0ede8', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: '#555', marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

// ── Type Badge ───────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const c = TYPE_COLORS[type] || TYPE_COLORS.easy;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
      background: c.bg, color: c.text, padding: '2px 7px', borderRadius: 4,
    }}>{c.label}</span>
  );
}

// ── Activity Row (feed item) ─────────────────────────────────────────────────
function ActivityRow({ activity, selected, onClick, unit }) {
  const { fmtDuration } = window.RVR;
  const dist = unit === 'mi' ? (activity.distance * 0.621371).toFixed(2) : activity.distance.toFixed(2);
  const unitLabel = unit === 'mi' ? 'mi' : 'km';
  const dateObj = new Date(activity.date + 'T00:00:00');
  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dow = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  return (
    <button onClick={onClick} style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      background: selected ? 'rgba(232,104,42,0.08)' : 'transparent',
      border: `1px solid ${selected ? 'rgba(232,104,42,0.25)' : 'transparent'}`,
      borderRadius: 10,
      padding: '12px 14px',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.15s',
    }}
    onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
    onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#f0ede8' }}>{activity.title}</span>
          <TypeBadge type={activity.type}/>
        </div>
        <div style={{ fontSize: 12, color: '#666' }}>{dow}, {dateStr} · {activity.startTime}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: selected ? ACCENT : '#f0ede8', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {dist}<span style={{ fontSize: 11, fontWeight: 400, color: '#666', marginLeft: 3 }}>{unitLabel}</span>
        </div>
        <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>{fmtDuration(activity.duration)}</div>
      </div>
    </button>
  );
}

Object.assign(window, {
  ACCENT, ACCENT_DIM, TYPE_COLORS,
  IconHome, IconActivity, IconCalendar, IconChevron,
  IconMapPin, IconHeart, IconZap, IconSettings, IconRun,
  ElevationChart, MiniSparkline, RouteMap, SplitsChart,
  LineChart, PaceChart, HRChart,
  StatCard, TypeBadge, ActivityRow,
});
