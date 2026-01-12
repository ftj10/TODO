import type { Task } from "../types";
import dayjs from "dayjs";
import { weekStartMonday } from "./date";

const TASKS_KEY = "weekly_todo_tasks_v1";
const WEEK_KEY = "weekly_todo_lastWeekStart_v1";

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? (JSON.parse(raw) as Task[]) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

// export function rolloverIfNeeded(tasks: Task[]): Task[] {
//   const now = dayjs();
//   const currentWeekStart = weekStartMonday(now);
//   const lastWeekStart = localStorage.getItem(WEEK_KEY);

//   if (lastWeekStart !== currentWeekStart) {
//     const kept = tasks.filter((t) => {
//       if (t.type !== "TEMPORARY") return true;
//       if (!t.date) return false;
//       return t.date >= currentWeekStart;
//     });
//     localStorage.setItem(WEEK_KEY, currentWeekStart);
//     saveTasks(kept);
//     return kept;
//   }

//   if (!lastWeekStart) localStorage.setItem(WEEK_KEY, currentWeekStart);
//   return tasks;
// }

/**
 * Disabled weekly rollover cleanup:
 * - TEMPORARY tasks will NOT be deleted automatically anymore.
 * - We only update WEEK_KEY (optional, for future use).
 */

export function rolloverIfNeeded(tasks: Task[]): Task[] {
  const now = dayjs();
  const currentWeekStart = weekStartMonday(now);

  // Keep WEEK_KEY updated (optional)
  const lastWeekStart = localStorage.getItem(WEEK_KEY);
  if (!lastWeekStart || lastWeekStart !== currentWeekStart) {
    localStorage.setItem(WEEK_KEY, currentWeekStart);
  }

  // ✅ No deletion
  return tasks;
}
