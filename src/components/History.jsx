import { useState, useEffect } from "react";
import { getAllLogs, getWorkoutDates, deleteLogsByDate } from "../utils/csvStorage";
import { showToast } from "../App";

function toDateStr(d) { return d.toISOString().slice(0, 10); }

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function History({ routine }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [loggedDates, setLoggedDates] = useState([]);
  const [dayLogs, setDayLogs] = useState([]);

  useEffect(() => {
    setLoggedDates(getWorkoutDates());
  }, []);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  };

  const selectDate = (day) => {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(ds);
    const all = getAllLogs();
    const filtered = all.filter((l) => l.date === ds);
    setDayLogs(filtered);
  };

  const handleDelete = (date) => {
    if (!window.confirm(`Delete all logs for ${date}?`)) return;
    deleteLogsByDate(date);
    setLoggedDates((prev) => prev.filter((d) => d !== date));
    setSelectedDate(null);
    setDayLogs([]);
    showToast("🗑️ Logs deleted");
  };

  // Group logs by exercise
  const grouped = dayLogs.reduce((acc, l) => {
    if (!acc[l.exercise]) acc[l.exercise] = [];
    acc[l.exercise].push(l);
    return acc;
  }, {});

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

  // Stats for selected date
  const totalVol = dayLogs.reduce((a, l) => a + (parseFloat(l.weight_kg) || 0) * (parseInt(l.reps) || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1>History</h1>
        <p>Browse your past workouts</p>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Calendar */}
        <div className="card" style={{ padding: "16px" }}>
          {/* Month nav */}
          <div className="row-between" style={{ marginBottom: "14px" }}>
            <button className="btn btn-ghost btn-icon" onClick={prevMonth}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{MONTHS[month]} {year}</span>
            <button className="btn btn-ghost btn-icon" onClick={nextMonth} disabled={year === today.getFullYear() && month === today.getMonth()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>

          {/* Day labels */}
          <div className="calendar-grid" style={{ marginBottom: "6px" }}>
            {DAYS.map((d, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, paddingBottom: "4px" }}>{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="calendar-grid">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hasLog = loggedDates.includes(ds);
              const isToday = ds === toDateStr(today);
              const isSelected = ds === selectedDate;
              return (
                <div
                  key={day}
                  onClick={() => selectDate(day)}
                  style={{
                    aspectRatio: "1", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.72rem", fontWeight: isToday || isSelected ? 700 : 400, cursor: "pointer",
                    background: isSelected ? "var(--accent)" : hasLog ? "rgba(139,92,246,0.35)" : "var(--bg-surface)",
                    color: isSelected ? "#fff" : hasLog ? "var(--accent-light)" : isToday ? "var(--text-primary)" : "var(--text-muted)",
                    boxShadow: isToday && !isSelected ? "0 0 0 2px var(--accent-light)" : "none",
                    transition: "all 0.15s",
                  }}
                >{day}</div>
              );
            })}
          </div>
        </div>

        {/* Selected day logs */}
        {selectedDate && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="row-between">
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>{new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" })}</h2>
                {dayLogs.length > 0 && (
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    {Object.keys(grouped).length} exercises · {dayLogs.length} sets · {Math.round(totalVol)} kg volume
                  </p>
                )}
              </div>
              {dayLogs.length > 0 && (
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedDate)}>Delete</button>
              )}
            </div>

            {dayLogs.length === 0 ? (
              <div className="empty-state">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <p>No workout logged on this day</p>
              </div>
            ) : (
              Object.entries(grouped).map(([exName, sets]) => {
                const vol = sets.reduce((a, s) => a + (parseFloat(s.weight_kg) || 0) * (parseInt(s.reps) || 0), 0);
                const bestSet = sets.reduce((best, s) => (parseFloat(s.weight_kg) || 0) > (parseFloat(best.weight_kg) || 0) ? s : best, sets[0]);
                return (
                  <div key={exName} className="card" style={{ padding: "14px" }}>
                    <div className="row-between" style={{ marginBottom: "10px" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{exName}</span>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{Math.round(vol)} kg vol</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {sets.map((s, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr 1fr", gap: "6px", alignItems: "center" }}>
                          <div style={{ textAlign: "center", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700 }}>{i + 1}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center" }}>{s.reps} reps</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center" }}>{s.weight_kg} kg</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "center" }}>
                            {Math.round((parseFloat(s.weight_kg) || 0) * (parseInt(s.reps) || 0))} kg
                          </div>
                        </div>
                      ))}
                    </div>
                    {bestSet && (
                      <div style={{ marginTop: "8px", padding: "6px 10px", background: "var(--bg-surface)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Best set</span>
                        <span style={{ fontSize: "0.78rem", color: "var(--accent-light)", fontWeight: 600 }}>{bestSet.reps} reps @ {bestSet.weight_kg} kg</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        <div style={{ paddingBottom: "8px" }} />
      </div>
    </div>
  );
}
