import type { Habit, HabitLog } from "./types";
import {
  addDays,
  fromDateKey,
  startOfWeek,
  toDateKey,
  todayKey,
  pct,
} from "./utils";

/** Weekday index, Monday = 0 … Sunday = 6. */
export function dowMon(dateKey: string): number {
  return (fromDateKey(dateKey).getDay() + 6) % 7;
}

export function isScheduled(habit: Habit, dateKey: string): boolean {
  switch (habit.frequency) {
    case "daily":
      return true;
    case "weekdays":
      return dowMon(dateKey) <= 4;
    case "custom":
      return habit.days.includes(dowMon(dateKey));
    case "weekly":
      return true; // any day contributes to the weekly target
    default:
      return true;
  }
}

export function valueFor(logs: HabitLog[], habitId: string, dateKey: string): number {
  const log = logs.find((l) => l.habit_id === habitId && l.date === dateKey);
  return log ? log.value : 0;
}

export function isDayComplete(habit: Habit, value: number): boolean {
  if (habit.type === "boolean") return value >= 1;
  return value >= habit.target_daily && habit.target_daily > 0;
}

export function dayCompletionRatio(habit: Habit, value: number): number {
  if (habit.type === "boolean") return value >= 1 ? 1 : 0;
  if (habit.target_daily <= 0) return value > 0 ? 1 : 0;
  return Math.min(1, value / habit.target_daily);
}

/** Iterate scheduled day-keys from `from` up to today (inclusive). */
function scheduledDays(habit: Habit, from: Date, to: Date): string[] {
  const out: string[] = [];
  let d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const limit = new Date(to);
  let guard = 0;
  while (d <= limit && guard++ < 1000) {
    const key = toDateKey(d);
    if (isScheduled(habit, key)) out.push(key);
    d = addDays(d, 1);
  }
  return out;
}

export interface StreakInfo {
  current: number;
  best: number;
}

function dayStreak(habit: Habit, logs: HabitLog[]): StreakInfo {
  const created = fromDateKey(toDateKey(habit.created_at));
  const today = todayKey();

  // Current streak — walk back from today, today gets a grace pass.
  let current = 0;
  let day = fromDateKey(today);
  let guard = 0;
  while (guard++ < 1000) {
    const key = toDateKey(day);
    if (fromDateKey(key) < created) break;
    if (isScheduled(habit, key)) {
      const done = isDayComplete(habit, valueFor(logs, habit.id, key));
      if (done) {
        current++;
      } else if (key !== today) {
        break;
      }
    }
    day = addDays(day, -1);
  }

  // Best streak — scan forward through history.
  let best = 0;
  let run = 0;
  for (const key of scheduledDays(habit, created, fromDateKey(today))) {
    if (isDayComplete(habit, valueFor(logs, habit.id, key))) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  best = Math.max(best, current);
  return { current, best };
}

function weeklyStreak(habit: Habit, logs: HabitLog[]): StreakInfo {
  const target = habit.target_weekly && habit.target_weekly > 0 ? habit.target_weekly : 1;
  const created = startOfWeek(fromDateKey(toDateKey(habit.created_at)));
  const thisWeek = startOfWeek(new Date());

  const weekCount = (weekStart: Date): number => {
    let n = 0;
    for (let i = 0; i < 7; i++) {
      const key = toDateKey(addDays(weekStart, i));
      if (isDayComplete(habit, valueFor(logs, habit.id, key))) n++;
    }
    return n;
  };

  let current = 0;
  let w = new Date(thisWeek);
  let guard = 0;
  while (w >= created && guard++ < 520) {
    const met = weekCount(w) >= target;
    const isCurrentWeek = w.getTime() === thisWeek.getTime();
    if (met) current++;
    else if (!isCurrentWeek) break;
    w = addDays(w, -7);
  }

  let best = 0;
  let run = 0;
  let cw = new Date(created);
  guard = 0;
  while (cw <= thisWeek && guard++ < 520) {
    if (weekCount(cw) >= target) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
    cw = addDays(cw, 7);
  }
  return { current, best: Math.max(best, current) };
}

export function habitStreak(habit: Habit, logs: HabitLog[]): StreakInfo {
  return habit.frequency === "weekly" ? weeklyStreak(habit, logs) : dayStreak(habit, logs);
}

/** Completion ratio (0..1) of all scheduled habits for a given day. */
export function dayScore(
  habits: Habit[],
  logs: HabitLog[],
  dateKey: string,
): { done: number; total: number; ratio: number } {
  const scheduled = habits.filter((h) => !h.archived && isScheduled(h, dateKey));
  if (!scheduled.length) return { done: 0, total: 0, ratio: 0 };
  let done = 0;
  for (const h of scheduled) {
    if (isDayComplete(h, valueFor(logs, h.id, dateKey))) done++;
  }
  return { done, total: scheduled.length, ratio: done / scheduled.length };
}

export interface SeriesPoint {
  label: string;
  key: string;
  value: number; // 0..100 completion
}

/** Last `days` days of completion %, oldest → newest. */
export function completionSeries(
  habits: Habit[],
  logs: HabitLog[],
  days: number,
  endDate = new Date(),
): SeriesPoint[] {
  const labels = ["L", "M", "M", "J", "V", "S", "D"];
  const out: SeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(endDate, -i);
    const key = toDateKey(d);
    const { ratio } = dayScore(habits, logs, key);
    out.push({
      label: days <= 7 ? labels[(d.getDay() + 6) % 7] : String(d.getDate()),
      key,
      value: Math.round(ratio * 100),
    });
  }
  return out;
}

/** Heatmap data for a single habit: completion ratio per day. */
export function habitHeatmap(
  habit: Habit,
  logs: HabitLog[],
  days: number,
): { key: string; ratio: number; scheduled: boolean }[] {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = toDateKey(addDays(new Date(), -i));
    const scheduled = isScheduled(habit, key);
    out.push({
      key,
      scheduled,
      ratio: scheduled ? dayCompletionRatio(habit, valueFor(logs, habit.id, key)) : 0,
    });
  }
  return out;
}

/** Average completion % over a window ending `offset` days before today. */
export function periodAverage(
  habits: Habit[],
  logs: HabitLog[],
  days: number,
  offset = 0,
): number {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < days; i++) {
    const key = toDateKey(addDays(new Date(), -(i + offset)));
    const { total, ratio } = dayScore(habits, logs, key);
    if (total > 0) {
      sum += ratio * 100;
      count++;
    }
  }
  return count ? Math.round(sum / count) : 0;
}

/** % of scheduled days completed for a single habit over the last N days. */
export function habitCompletionInWindow(habit: Habit, logs: HabitLog[], days: number): number {
  let scheduled = 0;
  let done = 0;
  for (let i = 0; i < days; i++) {
    const key = toDateKey(addDays(new Date(), -i));
    if (!isScheduled(habit, key)) continue;
    scheduled++;
    if (isDayComplete(habit, valueFor(logs, habit.id, key))) done++;
  }
  return scheduled ? Math.round((done / scheduled) * 100) : 0;
}

const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/** Average completion % per month for the last `months` months. */
export function monthlySeries(habits: Habit[], logs: HabitLog[], months: number): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  const now = new Date();
  for (let m = months - 1; m >= 0; m--) {
    const ref = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
    let sum = 0;
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(ref.getFullYear(), ref.getMonth(), d);
      if (date > now) break;
      const { total, ratio } = dayScore(habits, logs, toDateKey(date));
      if (total > 0) {
        sum += ratio * 100;
        count++;
      }
    }
    out.push({
      label: MONTHS_SHORT[ref.getMonth()],
      key: `${ref.getFullYear()}-${ref.getMonth()}`,
      value: count ? Math.round(sum / count) : 0,
    });
  }
  return out;
}

/** Overall stats for the dashboard hero. */
export function overview(habits: Habit[], logs: HabitLog[]) {
  const today = todayKey();
  const score = dayScore(habits, logs, today);
  const active = habits.filter((h) => !h.archived);

  // Best current streak across habits.
  let topStreak = 0;
  for (const h of active) {
    topStreak = Math.max(topStreak, habitStreak(h, logs).current);
  }

  // Productive minutes today = time-type habit values + completed focus habits estimate.
  let productiveMin = 0;
  for (const h of active) {
    if (h.type === "time") productiveMin += valueFor(logs, h.id, today);
  }

  const week = completionSeries(active, logs, 7);
  const weekAvg = week.length
    ? Math.round(week.reduce((s, p) => s + p.value, 0) / week.length)
    : 0;

  return {
    todayDone: score.done,
    todayTotal: score.total,
    todayPct: pct(score.done, score.total || 1),
    topStreak,
    productiveMin,
    weekAvg,
    week,
  };
}
