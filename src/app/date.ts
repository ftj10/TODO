import dayjs from "dayjs";

export function ymd(d: dayjs.Dayjs) {
  return d.format("YYYY-MM-DD");
}

// 1=Mon..7=Sun
export function weekdayISO(d: dayjs.Dayjs) {
  const dow = d.day(); // 0=Sun..6=Sat
  return dow === 0 ? 7 : dow;
}

// Monday week start date (YYYY-MM-DD)
export function weekStartMonday(d: dayjs.Dayjs) {
  const iso = weekdayISO(d);
  return ymd(d.subtract(iso - 1, "day"));
}
