import { useState, useEffect } from "react";
import { getAllLogs } from "../utils/csvStorage";

function LineChart({ data, color = "#8b5cf6" }) {
  if (!data || data.length < 2) return (
    <div className="empty-state" style={{ padding: "24px" }}>
      <p>Need at least 2 sessions to show chart</p>
    </div>
  );

  const W = 320;
  const H = 120;
  const pad = { top: 10, right: 12, bottom: 28, left: 36 };

  const values = data.map((d) => d.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const xStep = (W - pad.left - pad.right) / (data.length - 1);
  const scaleY = (v) => pad.top + ((maxV - v) / range) * (H - pad.top - pad.bottom);
  const scaleX = (i) => pad.left + i * xStep;

  const pts = data.map((d, i) => `${scaleX(i)},${scaleY(d.value)}`).join(" ");
  const area = `M${scaleX(0)},${scaleY(data[0].value)} ` +
    data.slice(1).map((d, i) => `L${scaleX(i + 1)},${scaleY(d.value)}`).join(" ") +
    ` L${scaleX(data.length - 1)},${H - pad.bottom} L${scaleX(0)},${H - pad.bottom} Z`;

  return (
    <div className="chart-wrap">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", minWidth: "260px" }}>
        {/* Y grid lines */}
        {[0, 0.5, 1].map((t) => {
          const y = pad.top + t * (H - pad.top - pad.bottom);
          const val = maxV - t * range;
          return (
            <g key={t}>
              <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x={pad.left - 4} y={y + 4} textAnchor="end" fill="#475569" fontSize="9">{Math.round(val)}</text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={area} fill={`${color}18`} />

        {/* Line */}
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots + labels */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={scaleX(i)} cy={scaleY(d.value)} r="3.5" fill={color} />
            {(i === 0 || i === data.length - 1 || data.length <= 6) && (
              <text x={scaleX(i)} y={H - pad.bottom + 14} textAnchor="middle" fill="#475569" fontSize="8">
                {d.date.slice(5)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function Progress() {
  const [logs, setLogs] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selected, setSelected] = useState(null);
  const [metric, setMetric] = useState("max_weight");

  useEffect(() => {
    const all = getAllLogs();
    setLogs(all);
    const exs = [...new Set(all.map((l) => l.exercise))].filter(Boolean).sort();
    setExercises(exs);
    if (exs.length > 0 && !selected) setSelected(exs[0]);
  }, []);

  const chartData = (() => {
    if (!selected) return [];
    const filtered = logs.filter((l) => l.exercise === selected);
    const byDate = filtered.reduce((acc, l) => {
      if (!acc[l.date]) acc[l.date] = [];
      acc[l.date].push(l);
      return acc;
    }, {});
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, sets]) => {
        const weights = sets.map((s) => parseFloat(s.weight_kg) || 0);
        const reps = sets.map((s) => parseInt(s.reps) || 0);
        const volume = sets.reduce((a, s) => a + (parseFloat(s.weight_kg) || 0) * (parseInt(s.reps) || 0), 0);
        const value =
          metric === "max_weight" ? Math.max(...weights)
          : metric === "total_volume" ? Math.round(volume)
          : sets.length;
        return { date, value };
      });
  })();

  const bestValue = chartData.length > 0 ? Math.max(...chartData.map((d) => d.value)) : 0;
  const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const improvement = chartData.length >= 2
    ? ((latestValue - chartData[0].value) / (chartData[0].value || 1) * 100).toFixed(1)
    : null;

  return (
    <div>
      <div className="page-header">
        <h1>Progress</h1>
        <p>Track your strength gains</p>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {exercises.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: "64px" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <p>Log some workouts first to see your progress charts here</p>
          </div>
        ) : (
          <>
            {/* Metric toggle */}
            <div className="row gap-sm">
              {[["max_weight", "Max Weight"], ["total_volume", "Volume"], ["sets_done", "Sets"]].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setMetric(key)}
                  style={{
                    flex: 1, padding: "8px 6px", borderRadius: "var(--radius-md)", border: "1px solid",
                    borderColor: metric === key ? "var(--accent)" : "var(--border)",
                    background: metric === key ? "rgba(139,92,246,0.15)" : "var(--bg-surface)",
                    color: metric === key ? "var(--accent-light)" : "var(--text-muted)",
                    fontFamily: "inherit", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >{label}</button>
              ))}
            </div>

            {/* Exercise picker */}
            <div style={{ overflowX: "auto", paddingBottom: "4px" }}>
              <div style={{ display: "flex", gap: "8px", width: "max-content" }}>
                {exercises.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setSelected(ex)}
                    style={{
                      padding: "6px 14px", borderRadius: "99px", border: "1px solid",
                      borderColor: selected === ex ? "var(--accent)" : "var(--border)",
                      background: selected === ex ? "rgba(139,92,246,0.15)" : "var(--bg-surface)",
                      color: selected === ex ? "var(--accent-light)" : "var(--text-secondary)",
                      fontFamily: "inherit", fontSize: "0.78rem", fontWeight: 500, cursor: "pointer",
                      whiteSpace: "nowrap", transition: "all 0.2s",
                    }}
                  >{ex}</button>
                ))}
              </div>
            </div>

            {/* Stats */}
            {selected && (
              <>
                <div className="row gap-md">
                  <div className="card stat-card" style={{ textAlign: "center" }}>
                    <div className="stat-value" style={{ color: "var(--accent-light)", fontSize: "1.4rem" }}>{bestValue}</div>
                    <div className="stat-label">Best</div>
                  </div>
                  <div className="card stat-card" style={{ textAlign: "center" }}>
                    <div className="stat-value" style={{ color: "var(--green)", fontSize: "1.4rem" }}>{latestValue}</div>
                    <div className="stat-label">Latest</div>
                  </div>
                  <div className="card stat-card" style={{ textAlign: "center" }}>
                    <div className="stat-value" style={{ color: improvement !== null && parseFloat(improvement) >= 0 ? "var(--green)" : "var(--red)", fontSize: "1.4rem" }}>
                      {improvement !== null ? `${improvement > 0 ? "+" : ""}${improvement}%` : "--"}
                    </div>
                    <div className="stat-label">Gain</div>
                  </div>
                </div>

                {/* Chart */}
                <div className="card" style={{ padding: "16px" }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {selected} — {metric === "max_weight" ? "Max Weight (kg)" : metric === "total_volume" ? "Total Volume (kg)" : "Sets Logged"}
                  </p>
                  <LineChart data={chartData} />
                </div>

                {/* Session history list */}
                <div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Session History</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[...chartData].reverse().map((d, i) => (
                      <div key={d.date} className="card" style={{ padding: "12px 14px" }}>
                        <div className="row-between">
                          <div>
                            <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent-light)" }}>{d.value}</div>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                              {metric === "max_weight" ? "kg" : metric === "total_volume" ? "kg vol" : "sets"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <div style={{ paddingBottom: "8px" }} />
      </div>
    </div>
  );
}
