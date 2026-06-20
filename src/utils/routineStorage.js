import { DEFAULT_ROUTINE } from "../data/routine";

const KEY = "gym_routine";

export function getRoutine() {
  try {
    const stored = localStorage.getItem(KEY);
    return stored ? JSON.parse(stored) : DEFAULT_ROUTINE;
  } catch {
    return DEFAULT_ROUTINE;
  }
}

export function saveRoutine(routine) {
  localStorage.setItem(KEY, JSON.stringify(routine));
}

export function resetRoutine() {
  localStorage.removeItem(KEY);
  return DEFAULT_ROUTINE;
}
