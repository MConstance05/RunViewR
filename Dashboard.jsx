// Dashboard.jsx — Home dashboard view with trends

function Dashboard({ onSelectActivity, onNavigate, unit, activities }) {
  const { fmtDuration } = window.RVR;
  const { StatCard, ActivityRow, ElevationChart, TypeBadge, IconMapPin, IconHeart, IconZap, ACCENT } = window;
  const { WeeklyVolumeChart, PaceTrendChart, MonthlyDistChart } = window;

  const acts = activities || window.RVR.activities;

  // This week stats
  const today = new Date('2026-04-19');
  const dow = today.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekActs = acts.filter(a => {
    const d = new Date(a.date + 'T00:00:00');
    return d >= weekStart && d <= weekEnd;
  });
  const weekDist = weekActs.reduce((s, a) => s + a.distance, 0);
  const weekTime = weekActs.reduce((s, a) => s + a.duration, 0);

  const fmtDist = (km) => unit === 'mi'
    ? `${(km * 0.621371).toFixed(1)} mi`
    : `${km.toFixed(1)} km`;

  const fmtWeekRange = () => {
    const opts = { month: 'short', day: 'numeric' };
    return `${weekStart.toLocaleDateString('en-US', opts)} – ${weekEnd.toLocaleDateString('en-US', opts)}`;
  };

  const recentActivities = acts.slice(0, 12);
  const latest = acts[0];
  const [previewId, setPreviewId] = React.useState(latest?.id);
  const previewActivity = acts.find(a => a.id === previewId) || latest;

  // All-time totals
  const totalDist = acts.reduce((s, a) => s + a.distance, 0);
  const totalTime = acts.reduce((s, a) => s + a.duration, 0);


  if (acts.length === 0) {
    return (
      <div style={{ height: '100%', overflowY: 'auto', paddingRight: 4 }}>
        <div style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '28px 24px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f0ede8', marginBottom: 8 }}>No activity data yet</div>
          <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>
            Connect Strava or Garmin in Settings, then click Sync Now to import your runs.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', paddingRight: 4 }}>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="This Week" value={fmtDist(weekDist)} sub={`${weekActs.length} runs · ${fmtWeekRange()}`} accent />
        <StatCard label="Time This Week" value={fmtDuration(weekTime)} sub={`Avg ${weekActs.length ? fmtDuration(Math.round(weekTime / weekActs.length)) : '—'}/run`} />
        <StatCard label="All-Time Runs" value={acts.length} sub={`Since ${acts.length ? new Date(acts[acts.length - 1].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}`} />
        <StatCard label="All-Time Distance" value={fmtDist(totalDist)} sub={fmtDuration(totalTime) + ' total time'} />
      </div>

      {/* ── Trends section ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        {/* Weekly volume */}
        <div style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f0ede8' }}>Weekly Volume</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Distance per week</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <MonthlyDistChart activities={acts} unit={unit} />
            </div>
          </div>
          <WeeklyVolumeChart activities={acts} unit={unit} />
        </div>

        {/* Pace trend */}
        <div style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#f0ede8' }}>Pace Trend</div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Rolling avg · easy + tempo runs</div>
          </div>
          <PaceTrendChart activities={acts} />
        </div>
      </div>

      {/* ── Feed + Preview ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        {/* Run feed */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent Runs</h2>
            <button onClick={() => onNavigate('activities')} style={{
              fontSize: 12, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}>View all →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {recentActivities.map(a => (
              <div key={a.id}
                onMouseEnter={() => setPreviewId(a.id)}
                onMouseLeave={() => setPreviewId(latest?.id)}>
                <ActivityRow
                  activity={a}
                  selected={previewActivity?.id === a.id}
                  onClick={() => onSelectActivity(a)}
                  unit={unit}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Latest/hovered preview */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {previewId !== latest?.id ? 'Activity' : 'Latest Run'}
            </h2>
            {previewActivity && (
              <button onClick={() => onSelectActivity(previewActivity)} style={{
                fontSize: 12, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}>Details →</button>
            )}
          </div>

          {previewActivity && (
            <div style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
              <ElevationChart data={previewActivity.elevationProfile} height={56} uid={`prev${previewActivity.id}`} />
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#f0ede8' }}>{previewActivity.title}</span>
                    <TypeBadge type={previewActivity.type} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#555', fontSize: 11 }}>
                    <IconMapPin size={11} color="#444" />
                    <span>{previewActivity.location}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Dist', value: fmtDist(previewActivity.distance) },
                    { label: 'Pace', value: `${previewActivity.pace}/km` },
                    { label: 'Time', value: fmtDuration(previewActivity.duration) },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f0ede8', letterSpacing: '-0.01em' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { label: 'Elev', value: `+${previewActivity.elevationGain}m`, icon: <IconZap size={11} color="#555"/> },
                    { label: 'Avg HR', value: `${previewActivity.heartRate.avg} bpm`, icon: <IconHeart size={11} color="#555"/> },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {s.icon}
                      <div>
                        <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: '#aaa' }}>{s.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: '#3a3a3a', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10 }}>
                  {new Date(previewActivity.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {previewActivity.startTime}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 24 }}/>
    </div>
  );
}

Object.assign(window, { Dashboard });
