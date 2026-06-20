import Papa from "papaparse";

const KEY = "gym_logs";

function getLogs() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const result = Papa.parse(raw, { header: true, skipEmptyLines: true });
    return result.data || [];
  } catch {
    return [];
  }
}

function saveLogs(logs) {
  const csv = Papa.unparse(logs);
  localStorage.setItem(KEY, csv);
}

export function addLog(entry) {
  const logs = getLogs();
  logs.push(entry);
  saveLogs(logs);
}

export function getAllLogs() {
  return getLogs();
}

export function getLogsByDate(date) {
  return getLogs().filter((l) => l.date === date);
}

export function getLogsByExercise(name) {
  return getLogs().filter(
    (l) => l.exercise?.toLowerCase() === name.toLowerCase()
  );
}

export function deleteLogsByDate(date) {
  const logs = getLogs().filter((l) => l.date !== date);
  saveLogs(logs);
}

export function exportCSV() {
  const logs = getLogs();
  const csv = Papa.unparse(logs);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gym_log_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const existing = getLogs();
        const incoming = result.data || [];
        // merge deduplicated by date+exercise+sets
        const merged = [...existing];
        incoming.forEach((row) => {
          const dup = merged.find(
            (e) =>
              e.date === row.date &&
              e.exercise === row.exercise &&
              e.set_number === row.set_number
          );
          if (!dup) merged.push(row);
        });
        saveLogs(merged);
        resolve(merged);
      },
      error: reject,
    });
  });
}

export function getWorkoutDates() {
  const logs = getLogs();
  return [...new Set(logs.map((l) => l.date))];
}
