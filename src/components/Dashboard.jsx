import { useState, useEffect } from "react";
import { getAllLogs, getWorkoutDates, exportCSV, importCSV } from "../utils/csvStorage";
import { showToast } from "../App";

const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];

function getWeekDates() {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

export default function Dashboard({ routine, onNavigate }) {
  const today = toDateStr(new Date());
  const todayDay = new Date().getDay(); // 0=sun
  // Map Sunday=7, Mon=1... to routine days (day 1=Mon)
  const routineDayIndex = todayDay === 0 ? 6 : todayDay - 1;
  const todayRoutine = routine[routineDayIndex] || routine[0];

  const [loggedDates, setLoggedDates] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [totalSets, setTotalSets] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);

  useEffect(() => {
    const all = getAllLogs();
    const dates = getWorkoutDates();
    setLoggedDates(dates);
    const tl = all.filter((l) => l.date === today);
    setTodayLogs(tl);
    const vol = tl.reduce(
      (acc, l) => acc + (parseFloat(l.weight_kg) || 0) * (parseInt(l.reps) || 0),
      0
    );
    setTotalVolume(Math.round(vol));
    setTotalSets(tl.length);
  }, [today]);

  const weekDates = getWeekDates();
  const streak = (() => {
    let count = 0;
    const s = new Set(loggedDates);
    const d = new Date();
    while (true) {
      const ds = toDateStr(d);
      if (s.has(ds)) {
        count++;
        d.setDate(d.getDate() - 1);
      } else if (ds === today) {
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return count;
  })();

  const todayLogged = loggedDates.includes(today);
  const uniqueExercisesToday = [...new Set(todayLogs.map((l) => l.exercise))];

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    importCSV(file).then(() => {
      showToast("✅ CSV imported!");
      window.location.reload();
    });
  };

  return (
    <div>
      <div className="page-header">
        <div className="row-between">
          <div>
            <h1 style={{ background: "linear-gradient(135deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              GymTrack
            </h1>
            <p>{new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
          <div className="row gap-sm">
            <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Import
              <input type="file" accept=".csv" style={{ display: "none" }} onChange={handleImport} />
            </label>
            <button className="btn btn-ghost btn-sm" onClick={() => { exportCSV(); showToast("📥 CSV exported!"); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Export
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Stats Row */}
        <div className="row gap-md">
          <div className="card stat-card accent-border" style={{ textAlign: "center" }}>
            <div className="stat-value" style={{ color: "var(--accent-light)" }}>{streak}</div>
            <div className="stat-label">Day Streak 🔥</div>
          </div>
          <div className="card stat-card" style={{ textAlign: "center" }}>
            <div className="stat-value" style={{ color: "var(--green)" }}>{totalSets}</div>
            <div className="stat-label">Sets Today</div>
          </div>
          <div className="card stat-card" style={{ textAlign: "center" }}>
            <div className="stat-value" style={{ color: "var(--blue)" }}>{totalVolume > 999 ? `${(totalVolume/1000).toFixed(1)}k` : totalVolume}</div>
            <div className="stat-label">Volume (kg)</div>
          </div>
        </div>

        {/* Week view */}
        <div className="card" style={{ padding: "14px" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>This Week</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
            {weekDates.map((date, i) => {
              const isToday = date === today;
              const done = loggedDates.includes(date);
              return (
                <div key={date} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 600 }}>{DAYS_OF_WEEK[i]}</span>
                  <div style={{
                    width: "100%", aspectRatio: "1", borderRadius: "8px",
                    background: done ? "var(--accent)" : "var(--bg-surface)",
                    boxShadow: isToday ? "0 0 0 2px var(--accent-light)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.65rem", fontWeight: 700, color: done ? "#fff" : isToday ? "var(--accent-light)" : "var(--text-muted)"
                  }}>
                    {new Date(date + "T00:00:00").getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's workout */}
        <div className="card accent-border" style={{ padding: "18px" }}>
          <div className="row-between" style={{ marginBottom: "12px" }}>
            <div>
              <div className="row gap-sm" style={{ marginBottom: "6px" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Day {todayRoutine.day}</span>
                {todayLogged && <span className="badge badge-green">✓ Logged</span>}
                {todayRoutine.isRest && <span className="badge badge-muted">Rest Day</span>}
              </div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{todayRoutine.label}</h2>
              <div className="row gap-sm" style={{ marginTop: "6px", flexWrap: "wrap" }}>
                {todayRoutine.focus.map((f) => (
                  <span key={f} className="muscle-tag">{f}</span>
                ))}
              </div>
            </div>
          </div>

          {todayLogged && uniqueExercisesToday.length > 0 && (
            <div style={{ marginBottom: "12px", padding: "10px 12px", background: "var(--bg-surface)", borderRadius: "var(--radius-md)" }}>
              <p style={{ fontSize: "0.72rem", color: "var(--green)", fontWeight: 600, marginBottom: "6px" }}>Logged today</p>
              {uniqueExercisesToday.map((ex) => {
                const sets = todayLogs.filter((l) => l.exercise === ex);
                return (
                  <div key={ex} className="row-between" style={{ marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{ex}</span>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{sets.length} sets</span>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
            {todayRoutine.exercises.map((ex, i) => (
              <div key={i} className="row gap-sm" style={{ padding: "6px 0" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{ex.name}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "8px" }}>{ex.sets}×{ex.reps}</span>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-primary btn-full" onClick={() => onNavigate("log")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {todayLogged ? "Add More Sets" : "Start Workout"}
          </button>
        </div>

        {/* Routine overview */}
        <div style={{ paddingBottom: "8px" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Full Routine</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {routine.map((r) => {
              const isActive = r.day === todayRoutine.day;
              return (
                <div key={r.day} className="card" style={{ padding: "12px 14px", borderColor: isActive ? "var(--border-accent)" : "var(--border)" }}>
                  <div className="row-between">
                    <div className="row gap-sm">
                      <div style={{
                        width: "28px", height: "28px", borderRadius: "8px",
                        background: isActive ? "var(--accent)" : "var(--bg-surface)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.75rem", fontWeight: 700, color: isActive ? "#fff" : "var(--text-muted)", flexShrink: 0
                      }}>{r.day}</div>
                      <div>
                        <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{r.label}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{r.isRest ? "Rest" : `${r.exercises.length} exercises`}</div>
                      </div>
                    </div>
                    {isActive && <span className="badge badge-accent">Today</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
