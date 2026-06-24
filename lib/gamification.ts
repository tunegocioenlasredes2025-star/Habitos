import type { Goal, Habit, HabitLog } from "./types";
import { habitStreak, isDayComplete, valueFor } from "./stats";
import { toDateKey } from "./utils";

export const POINTS_PER_HABIT = 10;
export const POINTS_PER_GOAL = 150;
export const STREAK_BONUS_STEP = 7; // every 7-day streak adds a bonus

/** Total points derived from real activity (consistent, not stored state). */
export function computePoints(habits: Habit[], logs: HabitLog[], goals: Goal[]): number {
  let points = 0;

  // Each completed habit-day.
  const byHabit = new Map<string, Habit>();
  habits.forEach((h) => byHabit.set(h.id, h));
  const seen = new Set<string>();
  for (const log of logs) {
    const habit = byHabit.get(log.habit_id);
    if (!habit) continue;
    const dedupe = `${log.habit_id}:${log.date}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    if (isDayComplete(habit, valueFor(logs, log.habit_id, log.date))) {
      points += POINTS_PER_HABIT;
    }
  }

  // Streak milestones.
  for (const h of habits) {
    if (h.archived) continue;
    const best = habitStreak(h, logs).best;
    points += Math.floor(best / STREAK_BONUS_STEP) * 25;
  }

  // Completed goals.
  points += goals.filter((g) => g.status === "completed").length * POINTS_PER_GOAL;

  return points;
}

export interface LevelInfo {
  level: number;
  into: number;
  span: number;
  pct: number;
  total: number;
}

export function levelInfo(points: number): LevelInfo {
  let level = 1;
  let needed = 120;
  let acc = 0;
  let guard = 0;
  while (points >= acc + needed && guard++ < 500) {
    acc += needed;
    level++;
    needed = Math.round((needed * 1.28) / 10) * 10;
  }
  const into = points - acc;
  return {
    level,
    into,
    span: needed,
    pct: Math.min(100, Math.round((into / needed) * 100)),
    total: points,
  };
}

export const LEVEL_TITLES = [
  "Iniciado",
  "Constante",
  "Enfocado",
  "Disciplinado",
  "Imparable",
  "Maestro",
  "Élite",
  "Leyenda",
];

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

/** Points earned today (for the little "+N" indicator). */
export function pointsToday(habits: Habit[], logs: HabitLog[]): number {
  const today = toDateKey(new Date());
  let p = 0;
  for (const h of habits) {
    if (isDayComplete(h, valueFor(logs, h.id, today))) p += POINTS_PER_HABIT;
  }
  return p;
}
