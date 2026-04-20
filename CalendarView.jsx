// CalendarView.jsx — Weekly / Monthly / Yearly calendar views

function CalendarView({ onSelectActivity, unit, activities: propActivities }) {
  const activities = propActivities || window.RVR.activities;
  const byDate = React.useMemo(() => {
    const m = {};
    activities.forEach(a => { if (!m[a.date]) m[a.date] = []; m[a.date].push(a); });
    return m;
  }, [activities]);
  const fmtDuration = window.RVR.fmtDuration;
  const { ACCENT, TypeBadge } = window;
  const [tab, setTab] = React.useState('monthly');
  const [monthOffset, setMonthOffset] = React.useState(0);
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [yearOffset, setYearOffset] = React.useState(0);

  const TODAY = new Date('2026-04-19');

  const fmtDist = (km) => unit === 'mi'
    ? `${(km * 0.621371).toFixed(1)} mi`
    : `${km.toFixed(1)} km`;

  const tabs = ['weekly', 'monthly', 'yearly'];

  if (activities.length === 0) {
    return (
      <div style={{ height: '100%', overflowY: 'auto' }}>
        <div style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '28px 24px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f0ede8', marginBottom: 8 }}>No calendar data yet</div>
          <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>
            Once you connect Strava or Garmin and sync your activities, your weekly, monthly, and yearly calendar views will appear here.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20, flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: tab === t ? ACCENT : 'rgba(255,255,255,0.05)',
            border: 'none',
            color: tab === t ? '#fff' : '#888',
            cursor: 'pointer', textTransform: 'capitalize',
            transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'weekly'  && <WeeklyCalendar weekOffset={weekOffset}  setWeekOffset={setWeekOffset}  today={TODAY} byDate={byDate} fmtDist={fmtDist} fmtDuration={fmtDuration} onSelect={onSelectActivity} />}
        {tab === 'monthly' && <MonthlyCalendar monthOffset={monthOffset} setMonthOffset={setMonthOffset} today={TODAY} byDate={byDate} fmtDist={fmtDist} fmtDuration={fmtDuration} onSelect={onSelectActivity} />}
        {tab === 'yearly'  && <YearlyCalendar  yearOffset={yearOffset}  setYearOffset={setYearOffset}  today={TODAY} byDate={byDate} fmtDist={fmtDist} activities={activities} />}
      </div>
    </div>
  );
}

// ── Nav header (prev/next + title) ───────────────────────────────────────────
function CalNav({ title, sub, onPrev, onNext, disableNext }) {
  const { IconChevron, ACCENT } = window;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#f0ede8', letterSpacing: '-0.02em' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <NavBtn onClick={onPrev}><IconChevron dir="left" size={15} /></NavBtn>
        <NavBtn onClick={onNext} disabled={disableNext}><IconChevron dir="right" size={15} /></NavBtn>
      </div>
    </div>
  );
}
function NavBtn({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 32, height: 32, borderRadius: 8,
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
      color: disabled ? '#333' : '#aaa', cursor: disabled ? 'default' : 'pointer',
    }}>{children}</button>
  );
}

// ── Period summary strip ─────────────────────────────────────────────────────
function PeriodSummary({ runs, fmtDist, fmtDuration }) {
  const dist = runs.reduce((s, a) => s + a.distance, 0);
  const time = runs.reduce((s, a) => s + a.duration, 0);
  const items = [
    { label: 'Runs', value: runs.length },
    { label: 'Distance', value: fmtDist(dist) },
    { label: 'Time', value: fmtDuration(time) },
    { label: 'Avg Pace', value: runs.length ? window.RVR.fmtPace(runs.reduce((s, a) => s + a.paceSec, 0) / runs.length) + '/km' : '—' },
  ];
  return (
    <div style={{ display: 'flex', gap: 20, padding: '12px 18px', background: '#181818', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 20 }}>
      {items.map(it => (
        <div key={it.label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: '#f0ede8', letterSpacing: '-0.02em' }}>{it.value}</span>
          <span style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Weekly view ───────────────────────────────────────────────────────────────
function WeeklyCalendar({ weekOffset, setWeekOffset, today, byDate, fmtDist, fmtDuration, onSelect }) {
  const { ACCENT } = window;
  const mon = new Date(today);
  const dow = mon.getDay(); // 0=Sun
  mon.setDate(mon.getDate() + (dow === 0 ? -6 : 1 - dow) + weekOffset * 7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    const key = d.toISOString().split('T')[0];
    return { date: d, key, runs: byDate[key] || [] };
  });

  const allRuns = days.flatMap(d => d.runs);
  const weekEnd = new Date(mon); weekEnd.setDate(mon.getDate() + 6);
  const title = `${mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxDist = Math.max(...days.map(d => d.runs.reduce((s, a) => s + a.distance, 0)), 1);

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <CalNav title={title} onPrev={() => setWeekOffset(o => o - 1)} onNext={() => setWeekOffset(o => o + 1)} disableNext={weekOffset >= 0} />
      <PeriodSummary runs={allRuns} fmtDist={fmtDist} fmtDuration={fmtDuration} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
        {days.map((day, i) => {
          const dist = day.runs.reduce((s, a) => s + a.distance, 0);
          const isToday = day.key === today.toISOString().split('T')[0];
          const hasRun = day.runs.length > 0;
          const barH = hasRun ? Math.max(8, (dist / maxDist) * 80) : 0;
          return (
            <div key={day.key} style={{
              background: isToday ? 'rgba(232,104,42,0.08)' : '#181818',
              border: `1px solid ${isToday ? 'rgba(232,104,42,0.25)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 12, padding: '14px 12px', minHeight: 140,
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ fontSize: 11, color: isToday ? ACCENT : '#555', fontWeight: 500, marginBottom: 4 }}>{DAYS[i]}</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: isToday ? ACCENT : hasRun ? '#f0ede8' : '#333', marginBottom: 8 }}>
                {day.date.getDate()}
              </div>
              {hasRun && (
                <>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', marginBottom: 8 }}>
                    <div style={{ width: '100%', height: barH, background: ACCENT, borderRadius: 4, opacity: 0.7 }}/>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f0ede8' }}>{fmtDist(dist)}</div>
                  {day.runs.map(r => (
                    <button key={r.id} onClick={() => onSelect(r)} style={{
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      fontSize: 11, color: '#666', textAlign: 'left', marginTop: 2,
                    }}>{r.title}</button>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Monthly view ──────────────────────────────────────────────────────────────
function MonthlyCalendar({ monthOffset, setMonthOffset, today, byDate, fmtDist, fmtDuration, onSelect }) {
  const { ACCENT } = window;
  const ref = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const startPad = firstDow === 0 ? 6 : firstDow - 1; // Monday-first

  const monthRuns = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (byDate[key]) monthRuns.push(...byDate[key]);
  }

  const title = ref.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const DOWS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayKey = today.toISOString().split('T')[0];

  const cells = [
    ...Array.from({ length: startPad }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <CalNav title={title} onPrev={() => setMonthOffset(o => o - 1)} onNext={() => setMonthOffset(o => o + 1)} disableNext={monthOffset >= 0} />
      <PeriodSummary runs={monthRuns} fmtDist={fmtDist} fmtDuration={fmtDuration} />
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DOWS.map(d => (
          <div key={d} style={{ fontSize: 11, color: '#444', textAlign: 'center', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{d}</div>
        ))}
      </div>
      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const runs = byDate[key] || [];
          const dist = runs.reduce((s, a) => s + a.distance, 0);
          const isToday = key === todayKey;
          const hasRun = runs.length > 0;
          return (
            <div
              key={key}
              onClick={() => runs.length === 1 && onSelect(runs[0])}
              style={{
                background: hasRun ? 'rgba(232,104,42,0.1)' : isToday ? 'rgba(255,255,255,0.04)' : '#141414',
                border: `1px solid ${isToday ? 'rgba(232,104,42,0.3)' : hasRun ? 'rgba(232,104,42,0.18)' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: 8, padding: '8px 8px', minHeight: 64,
                cursor: runs.length > 0 ? 'pointer' : 'default',
                transition: 'background 0.12s',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? ACCENT : hasRun ? '#ccc' : '#444', marginBottom: 4 }}>
                {day}
              </div>
              {hasRun && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 600, color: ACCENT, lineHeight: 1 }}>
                    {fmtDist(dist)}
                  </div>
                  {runs.map(r => (
                    <div key={r.id} style={{ fontSize: 10, color: '#777', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.title}
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Yearly view ───────────────────────────────────────────────────────────────
function YearlyCalendar({ yearOffset, setYearOffset, today, byDate, fmtDist, activities }) {
  const { ACCENT } = window;
  const year = today.getFullYear() + yearOffset;
  const yearRuns = activities.filter(a => a.date.startsWith(`${year}-`));
  const yearDist = yearRuns.reduce((s, a) => s + a.distance, 0);

  const maxDayDist = React.useMemo(() => {
    let max = 0;
    Object.entries(byDate).forEach(([key, runs]) => {
      if (key.startsWith(`${year}-`)) {
        const d = runs.reduce((s, a) => s + a.distance, 0);
        if (d > max) max = d;
      }
    });
    return max || 1;
  }, [year]);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <CalNav
        title={`${year}`}
        sub={`${yearRuns.length} runs · ${fmtDist(yearDist)}`}
        onPrev={() => setYearOffset(o => o - 1)}
        onNext={() => setYearOffset(o => o + 1)}
        disableNext={yearOffset >= 0}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {MONTHS.map((mName, mIdx) => {
          const daysInMonth = new Date(year, mIdx + 1, 0).getDate();
          const firstDow = new Date(year, mIdx, 1).getDay();
          const startPad = firstDow === 0 ? 6 : firstDow - 1;
          const cells = [
            ...Array(startPad).fill(null),
            ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
          ];
          while (cells.length % 7 !== 0) cells.push(null);

          const monthRuns = [];
          for (let d = 1; d <= daysInMonth; d++) {
            const key = `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (byDate[key]) monthRuns.push(...byDate[key]);
          }
          const monthDist = monthRuns.reduce((s, a) => s + a.distance, 0);

          return (
            <div key={mName} style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>{mName}</span>
                <span style={{ fontSize: 12, color: monthDist > 0 ? ACCENT : '#444', fontWeight: 500 }}>
                  {monthDist > 0 ? fmtDist(monthDist) : '—'}
                </span>
              </div>
              {/* Mini day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 2 }}>
                {['M','T','W','T','F','S','S'].map((d, i) => (
                  <div key={i} style={{ fontSize: 9, color: '#333', textAlign: 'center' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                {cells.map((day, ci) => {
                  if (!day) return <div key={`e${ci}`} style={{ aspectRatio: '1' }}/>;
                  const key = `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const runs = byDate[key] || [];
                  const dist = runs.reduce((s, a) => s + a.distance, 0);
                  const intensity = runs.length ? Math.max(0.15, Math.min(1, dist / maxDayDist)) : 0;
                  const todayKey = today.toISOString().split('T')[0];
                  const isToday = key === todayKey;
                  return (
                    <div key={key} title={runs.length ? `${day} ${mName}: ${fmtDist(dist)}` : ''} style={{
                      aspectRatio: '1', borderRadius: 2,
                      background: runs.length
                        ? `rgba(232,104,42,${intensity * 0.85})`
                        : isToday ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                      border: isToday ? '1px solid rgba(232,104,42,0.4)' : 'none',
                    }}/>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { CalendarView });
