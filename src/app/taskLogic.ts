import dayjs from "dayjs";
import type { Task } from "../types";
import { weekdayISO, ymd } from "./date";
import type { CompletionMap } from "./completions";
import { isDoneForDate } from "./completions";

export function tasksForDate(all: Task[], dateYmd: string, completions: CompletionMap): Task[] {
  const d = dayjs(dateYmd);
  const iso = weekdayISO(d);

  const permanents = all.filter((t) => {
    if (t.type !== "PERMANENT") return false;
    if (t.weekday !== iso) return false;
    return !isDoneForDate(completions, t.id, dateYmd);
  });

  const temporaries = all.filter(
    (t) => t.type === "TEMPORARY" && t.date === dateYmd && !t.done
  );

  // Sort by emergency level (ascending: 1 highest) then by title.
  return [...permanents, ...temporaries].sort((a, b) => {
    const ea = a.emergency ?? 5;
    const eb = b.emergency ?? 5;
    if (ea !== eb) return ea - eb;
    return a.title.localeCompare(b.title);
  });
}

/**
 * Generate calendar events for whatever date range FullCalendar is currently showing.
 * - Permanents repeat weekly because we generate an occurrence for every matching weekday in the range.
 * - Permanents can be hidden for a date if marked done-for-that-date in completions.
 * - Temporaries appear only on their date (if within range and not done).
 *
 * Emergency levels influence the colouring of events: higher emergency (1) results in a darker colour.
 */
export function toCalendarEventsForRange(
  all: Task[],
  completions: CompletionMap,
  rangeStart: dayjs.Dayjs,
  rangeEnd: dayjs.Dayjs
) {
  const events: any[] = [];

  // Colour palette for emergency levels. Lower number = higher urgency = darker colour.
  const colorMap: { [key: number]: { bg: string; border: string; text: string } } = {
    1: { bg: "#F44336", border: "#D32F2F", text: "#FFFFFF" }, // dark red
    2: { bg: "#FF8A65", border: "#F4511E", text: "#000000" }, // orange
    3: { bg: "#FFEB3B", border: "#FBC02D", text: "#000000" }, // yellow
    4: { bg: "#FFF59D", border: "#FDD835", text: "#000000" }, // pale yellow
    5: { bg: "#FFFFFF", border: "#E0E0E0", text: "#000000" }, // white/grey
  };

  // 1) Temporary tasks within the visible range
  for (const t of all) {
    if (t.type !== "TEMPORARY") continue;
    if (!t.date || t.done) continue;

    const d = dayjs(t.date);
    if (d.isBefore(rangeStart, "day")) continue;
    if (d.isAfter(rangeEnd.subtract(1, "day"), "day")) continue;

    const level = t.emergency ?? 5;
    const col = colorMap[level] ?? colorMap[5];

    events.push({
      id: t.id,
      title: t.title,
      start: t.date,
      allDay: true,
      extendedProps: { taskId: t.id },
      backgroundColor: col.bg,
      borderColor: col.border,
      textColor: col.text,
    });
  }

  // 2) Permanent tasks: generate an occurrence for each day in the range that matches weekday
  const permanents = all.filter((t) => t.type === "PERMANENT" && typeof t.weekday === "number");

  for (let cur = rangeStart.startOf("day"); cur.isBefore(rangeEnd, "day"); cur = cur.add(1, "day")) {
    const dateStr = ymd(cur);
    const iso = weekdayISO(cur);

    for (const t of permanents) {
      if (t.weekday !== iso) continue;
      if (isDoneForDate(completions, t.id, dateStr)) continue;

      const level = t.emergency ?? 5;
      const col = colorMap[level] ?? colorMap[5];

      events.push({
        id: `${t.id}::${dateStr}`,
        title: t.title,
        start: dateStr,
        allDay: true,
        extendedProps: { taskId: t.id },
        backgroundColor: col.bg,
        borderColor: col.border,
        textColor: col.text,
      });
    }
  }

  return events;
}