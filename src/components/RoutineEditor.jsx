import { useState } from "react";
import { saveRoutine, resetRoutine } from "../utils/routineStorage";
import { showToast } from "../App";

export default function RoutineEditor({ routine, onChange }) {
  const [editingDay, setEditingDay] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [newExName, setNewExName] = useState("");
  const [newExSets, setNewExSets] = useState("3");
  const [newExReps, setNewExReps] = useState("10-12");

  const openDay = (dayIdx) => {
    setEditingDay(dayIdx);
    setEditLabel(routine[dayIdx].label);
    setNewExName("");
  };

  const saveLabel = (dayIdx) => {
    const updated = routine.map((d, i) =>
      i === dayIdx ? { ...d, label: editLabel } : d
    );
    saveRoutine(updated);
    onChange(updated);
    showToast("✅ Day label updated");
  };

  const addExercise = (dayIdx) => {
    if (!newExName.trim()) { showToast("⚠️ Enter exercise name"); return; }
    const updated = routine.map((d, i) =>
      i === dayIdx
        ? { ...d, exercises: [...d.exercises, { name: newExName.trim(), sets: newExSets, reps: newExReps }] }
        : d
    );
    saveRoutine(updated);
    onChange(updated);
    setNewExName("");
    showToast(`✅ ${newExName} added`);
  };

  const removeExercise = (dayIdx, exIdx) => {
    const updated = routine.map((d, i) =>
      i === dayIdx
        ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) }
        : d
    );
    saveRoutine(updated);
    onChange(updated);
    showToast("🗑️ Exercise removed");
  };

  const moveExercise = (dayIdx, exIdx, direction) => {
    const exs = [...routine[dayIdx].exercises];
    const newIdx = exIdx + direction;
    if (newIdx < 0 || newIdx >= exs.length) return;
    [exs[exIdx], exs[newIdx]] = [exs[newIdx], exs[exIdx]];
    const updated = routine.map((d, i) => i === dayIdx ? { ...d, exercises: exs } : d);
    saveRoutine(updated);
    onChange(updated);
  };

  const updateExercise = (dayIdx, exIdx, field, value) => {
    const updated = routine.map((d, i) =>
      i === dayIdx
        ? { ...d, exercises: d.exercises.map((e, j) => j === exIdx ? { ...e, [field]: value } : e) }
        : d
    );
    saveRoutine(updated);
    onChange(updated);
  };

  const handleReset = () => {
    if (!window.confirm("Reset to default routine? This cannot be undone.")) return;
    const def = resetRoutine();
    onChange(def);
    setEditingDay(null);
    showToast("🔄 Routine reset to default");
  };

  return (
    <div>
      <div className="page-header">
        <div className="row-between">
          <div>
            <h1>Routine</h1>
            <p>Edit your workout plan</p>
          </div>
          <button className="btn btn-danger btn-sm" onClick={handleReset}>Reset</button>
        </div>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {routine.map((day, dayIdx) => {
          const isOpen = editingDay === dayIdx;
          return (
            <div key={day.day} className="card" style={{ overflow: "hidden" }}>
              {/* Day header */}
              <div
                style={{ padding: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                onClick={() => {
                  if (isOpen) setEditingDay(null);
                  else openDay(dayIdx);
                }}
              >
                <div className="row gap-sm">
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "10px", background: "rgba(139,92,246,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.82rem", fontWeight: 700, color: "var(--accent-light)", flexShrink: 0
                  }}>D{day.day}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{day.label}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{day.exercises.length} exercises</div>
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Expanded editor */}
              {isOpen && (
                <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="divider" style={{ margin: "0 0 4px" }} />

                  {/* Edit label */}
                  <div>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Day Label</p>
                    <div className="row gap-sm">
                      <input
                        className="input"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        placeholder="e.g. Chest & Triceps"
                      />
                      <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={() => saveLabel(dayIdx)}>Save</button>
                    </div>
                  </div>

                  {/* Exercise list */}
                  <div>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Exercises</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {day.exercises.map((ex, exIdx) => (
                        <div key={exIdx} style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-md)", padding: "10px 12px", border: "1px solid var(--border)" }}>
                          <div className="row-between" style={{ marginBottom: "8px" }}>
                            <input
                              className="input input-sm"
                              value={ex.name}
                              onChange={(e) => updateExercise(dayIdx, exIdx, "name", e.target.value)}
                              style={{ flex: 1, marginRight: "8px" }}
                              onBlur={() => { saveRoutine(routine); }}
                              placeholder="Exercise name"
                            />
                            <div className="row gap-sm">
                              <button className="btn btn-ghost btn-icon" onClick={() => moveExercise(dayIdx, exIdx, -1)} disabled={exIdx === 0} style={{ padding: "5px" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </button>
                              <button className="btn btn-ghost btn-icon" onClick={() => moveExercise(dayIdx, exIdx, 1)} disabled={exIdx === day.exercises.length - 1} style={{ padding: "5px" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </button>
                              <button className="btn btn-danger btn-icon" onClick={() => removeExercise(dayIdx, exIdx)} style={{ padding: "5px" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </button>
                            </div>
                          </div>
                          <div className="row gap-sm">
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>SETS</span>
                              <input
                                className="input input-sm"
                                value={ex.sets}
                                onChange={(e) => updateExercise(dayIdx, exIdx, "sets", e.target.value)}
                                onBlur={() => saveRoutine(routine)}
                                placeholder="3"
                              />
                            </div>
                            <div style={{ flex: 2 }}>
                              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>REPS</span>
                              <input
                                className="input input-sm"
                                value={ex.reps}
                                onChange={(e) => updateExercise(dayIdx, exIdx, "reps", e.target.value)}
                                onBlur={() => saveRoutine(routine)}
                                placeholder="8-12"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add exercise */}
                  <div style={{ background: "rgba(139,92,246,0.06)", borderRadius: "var(--radius-md)", padding: "12px", border: "1px dashed var(--border-accent)" }}>
                    <p style={{ fontSize: "0.72rem", color: "var(--accent-light)", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Add Exercise</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <input
                        className="input input-sm"
                        placeholder="Exercise name (e.g. Dumbbell Curl)"
                        value={newExName}
                        onChange={(e) => setNewExName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addExercise(dayIdx)}
                      />
                      <div className="row gap-sm">
                        <div style={{ flex: 1 }}>
                          <input
                            className="input input-sm"
                            placeholder="Sets"
                            value={newExSets}
                            onChange={(e) => setNewExSets(e.target.value)}
                          />
                        </div>
                        <div style={{ flex: 2 }}>
                          <input
                            className="input input-sm"
                            placeholder="Reps (e.g. 8-12)"
                            value={newExReps}
                            onChange={(e) => setNewExReps(e.target.value)}
                          />
                        </div>
                        <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={() => addExercise(dayIdx)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          Add
                        </button>
                      </div>
                    </div>
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
