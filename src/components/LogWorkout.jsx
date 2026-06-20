import { useState, useEffect } from "react";
import { addLog, getLogsByDate } from "../utils/csvStorage";
import { showToast } from "../App";

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

export default function LogWorkout({ routine }) {
  const today = toDateStr(new Date());
  const todayDay = new Date().getDay();
  const routineDayIndex = todayDay === 0 ? 6 : todayDay - 1;

  const [selectedDay, setSelectedDay] = useState(routineDayIndex);
  const [openEx, setOpenEx] = useState(null);
  const [setData, setSetData] = useState({});
  const [doneExercises, setDoneExercises] = useState(new Set());
  const [logDate, setLogDate] = useState(today);

  const dayRoutine = routine[selectedDay];

  useEffect(() => {
    // Load existing logs for this date
    const existing = getLogsByDate(logDate);
    const done = new Set(existing.map((l) => l.exercise));
    setDoneExercises(done);
    // Restore set data
    const restored = {};
    existing.forEach((l) => {
      const key = l.exercise;
      if (!restored[key]) restored[key] = [];
      restored[key].push({ reps: l.reps, weight: l.weight_kg, saved: true });
    });
    setSetData(restored);
  }, [logDate]);

  const handleSetChange = (exName, setIdx, field, value) => {
    setSetData((prev) => {
      const exSets = [...(prev[exName] || [])];
      if (!exSets[setIdx]) exSets[setIdx] = { reps: "", weight: "", saved: false };
      exSets[setIdx] = { ...exSets[setIdx], [field]: value, saved: false };
      return { ...prev, [exName]: exSets };
    });
  };

  const addSet = (exName) => {
    setSetData((prev) => {
      const exSets = [...(prev[exName] || [])];
      exSets.push({ reps: "", weight: "", saved: false });
      return { ...prev, [exName]: exSets };
    });
  };

  const removeSet = (exName, setIdx) => {
    setSetData((prev) => {
      const exSets = [...(prev[exName] || [])].filter((_, i) => i !== setIdx);
      return { ...prev, [exName]: exSets };
    });
  };

  const saveExercise = (ex) => {
    const sets = setData[ex.name] || [];
    if (sets.length === 0) {
      showToast("⚠️ Add at least one set");
      return;
    }
    const valid = sets.filter((s) => s.reps && s.weight !== "");
    if (valid.length === 0) {
      showToast("⚠️ Fill reps and weight");
      return;
    }
    valid.forEach((s, i) => {
      addLog({
        date: logDate,
        day: dayRoutine.day,
        exercise: ex.name,
        set_number: i + 1,
        reps: s.reps,
        weight_kg: s.weight,
        notes: "",
      });
    });
    setDoneExercises((prev) => new Set([...prev, ex.name]));
    showToast(`✅ ${ex.name} saved!`);
    setOpenEx(null);
  };

  const initSets = (ex) => {
    if (!setData[ex.name] || setData[ex.name].length === 0) {
      const count = parseInt(ex.sets) || 3;
      const empty = Array.from({ length: count }, () => ({ reps: "", weight: "", saved: false }));
      setSetData((prev) => ({ ...prev, [ex.name]: empty }));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Log Workout</h1>
        <p>Track your sets, reps &amp; weight</p>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* Date picker */}
        <div className="card" style={{ padding: "12px 14px" }}>
          <div className="row-between">
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Date</span>
            <input
              type="date"
              className="input"
              value={logDate}
              max={today}
              onChange={(e) => setLogDate(e.target.value)}
              style={{ width: "auto", padding: "6px 10px", fontSize: "0.85rem" }}
            />
          </div>
        </div>

        {/* Day selector */}
        <div style={{ overflowX: "auto", paddingBottom: "4px" }}>
          <div style={{ display: "flex", gap: "8px", width: "max-content" }}>
            {routine.map((r, i) => (
              <button
                key={r.day}
                onClick={() => setSelectedDay(i)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid",
                  borderColor: selectedDay === i ? "var(--accent)" : "var(--border)",
                  background: selectedDay === i ? "rgba(139,92,246,0.15)" : "var(--bg-surface)",
                  color: selectedDay === i ? "var(--accent-light)" : "var(--text-secondary)",
                  fontFamily: "inherit",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                }}
              >
                Day {r.day}
              </button>
            ))}
          </div>
        </div>

        {/* Day label */}
        <div className="row gap-sm" style={{ flexWrap: "wrap" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginRight: "8px" }}>{dayRoutine.label}</h2>
          {dayRoutine.focus.map((f) => (
            <span key={f} className="muscle-tag">{f}</span>
          ))}
          {dayRoutine.isRest && <span className="badge badge-muted">Rest Day</span>}
        </div>

        {/* Exercise cards */}
        {dayRoutine.exercises.map((ex) => {
          const isOpen = openEx === ex.name;
          const isDone = doneExercises.has(ex.name);
          const sets = setData[ex.name] || [];

          return (
            <div key={ex.name} className={`exercise-card${isDone ? " done" : ""}`}>
              <div
                className="exercise-header"
                onClick={() => {
                  if (!isOpen) initSets(ex);
                  setOpenEx(isOpen ? null : ex.name);
                }}
              >
                <div>
                  <div className="exercise-name">{ex.name}</div>
                  <div className="exercise-meta">{ex.sets} sets × {ex.reps} reps</div>
                </div>
                <div className="row gap-sm">
                  {isDone && (
                    <div className="check-circle checked">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {isOpen && (
                <div className="exercise-body">
                  {/* Column headers */}
                  <div className="set-row" style={{ marginBottom: "2px" }}>
                    <div className="set-label">Set</div>
                    <div className="set-label">Reps</div>
                    <div className="set-label">kg</div>
                    <div className="set-label"></div>
                  </div>

                  {sets.map((s, idx) => (
                    <div key={idx} className="set-row">
                      <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 700 }}>{idx + 1}</div>
                      <input
                        className="input input-sm"
                        type="number"
                        inputMode="numeric"
                        placeholder={ex.reps}
                        value={s.reps}
                        onChange={(e) => handleSetChange(ex.name, idx, "reps", e.target.value)}
                        style={{ textAlign: "center" }}
                      />
                      <input
                        className="input input-sm"
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        value={s.weight}
                        onChange={(e) => handleSetChange(ex.name, idx, "weight", e.target.value)}
                        style={{ textAlign: "center" }}
                      />
                      <button
                        className="btn btn-icon btn-danger"
                        onClick={() => removeSet(ex.name, idx)}
                        style={{ justifySelf: "center" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </div>
                  ))}

                  <div className="row gap-sm" style={{ marginTop: "4px" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => addSet(ex.name)}>
                      + Add Set
                    </button>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => saveExercise(ex)}>
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div style={{ paddingBottom: "8px" }} />
      </div>
    </div>
  );
}
