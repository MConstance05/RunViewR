// TrendCharts.jsx — Weekly volume bar chart + Pace trend line

// ── Weekly Volume Bar Chart ──────────────────────────────────────────────────
function WeeklyVolumeChart({ activities, unit, numWeeks = 16 }) {
  const { ACCENT } = window;
  const today = new Date('2026-04-19');

  // Build week buckets
  const weeks = React.useMemo(() => {
    const dow = today.getDay();
    const toMon = dow === 0 ? -6 : 1 - dow;
    const currentMon = new Date(today);
    currentMon.setDate(today.getDate() + toMon);

    return Array.from({ length: numWeeks }, (_, i) => {
      const mon = new Date(currentMon);
      mon.setDate(currentMon.getDate() - (numWeeks - 1 - i) * 7);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      const runs = activities.filter(a => {
        const d = new Date(a.date + 'T00:00:00');
        return d >= mon && d <= sun;
      });
      const dist = runs.reduce((s, a) => s + a.distance, 0);
      const label = mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { mon, sun, dist: Math.round(dist * 10) / 10, runs: runs.length, label, isCurrent: i === numWeeks - 1 };
    });
  }, [activities.length, unit]);

  const maxDist = Math.max(...weeks.map(w => w.dist), 1);
  const converted = (km) => unit === 'mi' ? km * 0.621371 : km;
  const unitLabel = unit === 'mi' ? 'mi' : 'km';

  const W = 600, H = 120, padB = 28, padT = 8, padL = 40, padR = 8;
  const innerW = W - padL - padR;
  const innerH = H - padB - padT;
  const barW = Math.floor(innerW / numWeeks) - 3;
  const [hovered, setHovered] = React.useState(null);

  // Y axis ticks
  const yTicks = 3;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => (maxDist / yTicks) * i);

  return (
    <div style={{ position: 'relative' }}>
      {/* Tooltip */}
      {hovered !== null && (
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#f0ede8',
          pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
        }}>
          <strong>{converted(weeks[hovered].dist).toFixed(1)} {unitLabel}</strong>
          <span style={{ color: '#666', marginLeft: 8 }}>{weeks[hovered].runs} run{weeks[hovered].runs !== 1 ? 's' : ''}</span>
          <span style={{ color: '#444', marginLeft: 8 }}>{weeks[hovered].label}</span>
        </div>
      )}
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        {/* Grid */}
        {tickVals.map((tv, i) => {
          const y = padT + innerH - (tv / maxDist) * innerH;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
              <text x={padL - 4} y={y + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.25)" fontFamily="DM Sans,sans-serif">
                {converted(tv).toFixed(0)}
              </text>
            </g>
          );
        })}
        {/* Bars */}
        {weeks.map((w, i) => {
          const barH = w.dist > 0 ? Math.max(3, (w.dist / maxDist) * innerH) : 0;
          const x = padL + (i / numWeeks) * innerW + 1.5;
          const y = padT + innerH - barH;
          const isHov = hovered === i;
          const fill = w.isCurrent ? ACCENT : isHov ? 'rgba(232,104,42,0.6)' : 'rgba(232,104,42,0.35)';
          return (
            <g key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'default' }}>
              <rect x={x} y={y} width={barW} height={barH} rx="2" fill={fill}/>
              {/* X label for every 4th week + current */}
              {(i % 4 === 0 || w.isCurrent) && (
                <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize="9"
                  fill={w.isCurrent ? ACCENT : 'rgba(255,255,255,0.25)'}
                  fontFamily="DM Sans,sans-serif" fontWeight={w.isCurrent ? '600' : '400'}>
                  {w.isCurrent ? 'Now' : w.label}
                </text>
              )}
            </g>
          );
        })}
        {/* Y axis */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 11, color: '#444' }}>16 weeks ago</span>
        <span style={{ fontSize: 11, color: ACCENT }}>This week</span>
      </div>
    </div>
  );
}

// ── Pace Trend Line Chart ─────────────────────────────────────────────────────
function PaceTrendChart({ activities, numWeeks = 16 }) {
  const { ACCENT } = window;
  const { fmtPace } = window.RVR;
  const today = new Date('2026-04-19');

  const weeklyPaces = React.useMemo(() => {
    const dow = today.getDay();
    const toMon = dow === 0 ? -6 : 1 - dow;
    const currentMon = new Date(today);
    currentMon.setDate(today.getDate() + toMon);
    return Array.from({ length: numWeeks }, (_, i) => {
      const mon = new Date(currentMon);
      mon.setDate(currentMon.getDate() - (numWeeks - 1 - i) * 7);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      const runs = activities.filter(a => {
        const d = new Date(a.date + 'T00:00:00');
        return d >= mon && d <= sun && a.type !== 'long' && a.type !== 'recovery';
      });
      if (!runs.length) return null;
      const avgPace = runs.reduce((s, a) => s + a.paceSec, 0) / runs.length;
      return { pace: Math.round(avgPace), label: mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isCurrent: i === numWeeks - 1 };
    });
  }, [activities.length]);

  const filled = weeklyPaces.filter(Boolean);
  if (filled.length < 2) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: '#444', fontSize: 13 }}>
      Not enough data yet
    </div>
  );

  // Compute rolling 3-week avg for smoothing
  const smoothed = weeklyPaces.map((w, i) => {
    if (!w) return null;
    const window3 = weeklyPaces.slice(Math.max(0, i - 2), i + 1).filter(Boolean);
    return { ...w, smoothPace: Math.round(window3.reduce((s, x) => s + x.pace, 0) / window3.length) };
  }).filter(Boolean);

  const paces = smoothed.map(w => w.smoothPace);
  const min = Math.min(...paces) - 10;
  const max = Math.max(...paces) + 10;
  const W = 600, H = 110, padB = 24, padT = 8, padL = 44, padR = 8;
  const innerW = W - padL - padR;
  const innerH = H - padB - padT;

  const allIndices = weeklyPaces.map((w, i) => w ? i : null).filter(x => x !== null);
  const sx = (idx) => padL + (idx / (numWeeks - 1)) * innerW;
  // Inverted: lower pace (faster) = higher on chart
  const sy = (pace) => padT + ((pace - min) / (max - min)) * innerH;

  let path = '';
  smoothed.forEach((w, i) => {
    const origIdx = allIndices[i];
    const x = sx(origIdx);
    const y = sy(w.smoothPace);
    if (i === 0) { path = `M ${x.toFixed(1)} ${y.toFixed(1)}`; return; }
    const prevIdx = allIndices[i - 1];
    const px = sx(prevIdx), py = sy(smoothed[i - 1].smoothPace);
    const cpx = (px + x) / 2;
    path += ` C ${cpx.toFixed(1)} ${py.toFixed(1)} ${cpx.toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  });

  const fillPath = `${path} L ${sx(allIndices[allIndices.length - 1]).toFixed(1)} ${padT + innerH} L ${sx(allIndices[0]).toFixed(1)} ${padT + innerH} Z`;

  // Trend arrow: compare first quarter vs last quarter avg pace
  const half = Math.floor(smoothed.length / 2);
  const firstHalf = smoothed.slice(0, half).map(w => w.smoothPace);
  const lastHalf = smoothed.slice(half).map(w => w.smoothPace);
  const avgFirst = firstHalf.reduce((s, v) => s + v, 0) / (firstHalf.length || 1);
  const avgLast = lastHalf.reduce((s, v) => s + v, 0) / (lastHalf.length || 1);
  const improving = avgLast < avgFirst; // lower pace = faster
  const diff = Math.abs(avgFirst - avgLast);

  const gid = 'ptgrad';

  return (
    <div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0.01"/>
          </linearGradient>
        </defs>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const pace = min + t * (max - min);
          const y = padT + t * innerH;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
              <text x={padL - 4} y={y + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.25)" fontFamily="DM Sans,sans-serif">
                {fmtPace(pace)}
              </text>
            </g>
          );
        })}
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
        <path d={fillPath} fill={`url(#${gid})`}/>
        <path d={path} fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Dots for each data point */}
        {smoothed.map((w, i) => {
          const origIdx = allIndices[i];
          return (
            <circle key={i} cx={sx(origIdx)} cy={sy(w.smoothPace)} r={w.isCurrent ? 4 : 2.5}
              fill={w.isCurrent ? ACCENT : '#4ade80'} opacity={w.isCurrent ? 1 : 0.7}/>
          );
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <span style={{ fontSize: 11, color: '#444' }}>16 weeks ago</span>
        <span style={{ fontSize: 11, color: improving ? '#4ade80' : '#f87171', fontWeight: 500 }}>
          {improving ? '▲' : '▼'} {diff > 1 ? `${fmtPace(diff)}/km ${improving ? 'faster' : 'slower'}` : 'Stable pace'}
        </span>
        <span style={{ fontSize: 11, color: ACCENT }}>This week</span>
      </div>
    </div>
  );
}

// ── Monthly Distance Bar Chart ────────────────────────────────────────────────
function MonthlyDistChart({ activities, unit }) {
  const { ACCENT } = window;
  const today = new Date('2026-04-19');
  const unitLabel = unit === 'mi' ? 'mi' : 'km';
  const conv = (km) => unit === 'mi' ? km * 0.621371 : km;

  const months = React.useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
      const y = d.getFullYear(), m = d.getMonth();
      const runs = activities.filter(a => {
        const ad = new Date(a.date + 'T00:00:00');
        return ad.getFullYear() === y && ad.getMonth() === m;
      });
      const dist = runs.reduce((s, a) => s + a.distance, 0);
      return {
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        dist: Math.round(dist * 10) / 10,
        runs: runs.length,
        isCurrent: i === 5,
      };
    });
  }, [activities.length, unit]);

  const maxDist = Math.max(...months.map(m => m.dist), 1);
  const [hov, setHov] = React.useState(null);
  const W = 300, H = 80, padB = 20, padT = 4, padL = 32, padR = 4;
  const innerW = W - padL - padR, innerH = H - padB - padT;
  const barW = Math.floor(innerW / 6) - 4;

  return (
    <div style={{ position: 'relative' }}>
      {hov !== null && (
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '5px 10px', fontSize: 12, color: '#f0ede8',
          pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
        }}>
          <strong>{conv(months[hov].dist).toFixed(0)} {unitLabel}</strong>
          <span style={{ color: '#666', marginLeft: 6 }}>{months[hov].runs} runs</span>
        </div>
      )}
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {months.map((m, i) => {
          const barH = m.dist > 0 ? Math.max(3, (m.dist / maxDist) * innerH) : 0;
          const x = padL + (i / 6) * innerW + 2;
          const y = padT + innerH - barH;
          const isHov = hov === i;
          return (
            <g key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} style={{ cursor: 'default' }}>
              <rect x={x} y={y} width={barW} height={barH} rx="2"
                fill={m.isCurrent ? ACCENT : isHov ? 'rgba(232,104,42,0.6)' : 'rgba(232,104,42,0.3)'}/>
              <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize="9"
                fill={m.isCurrent ? ACCENT : 'rgba(255,255,255,0.3)'}
                fontFamily="DM Sans,sans-serif" fontWeight={m.isCurrent ? '600' : '400'}>
                {m.label}
              </text>
            </g>
          );
        })}
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      </svg>
    </div>
  );
}

Object.assign(window, { WeeklyVolumeChart, PaceTrendChart, MonthlyDistChart });
