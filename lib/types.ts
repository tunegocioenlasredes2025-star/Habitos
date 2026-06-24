// ============================================================
// Domain types
// ============================================================

export type HabitType = "boolean" | "quantity" | "time";
export type Frequency = "daily" | "weekly" | "weekdays" | "custom";

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  category: string;
  type: HabitType;
  frequency: Frequency;
  /** For "custom" frequency: weekday indices 0..6 (Mon..Sun). */
  days: number[];
  color: string;
  /** Daily target. boolean → 1; quantity/time → amount. */
  target_daily: number;
  /** Optional weekly target (e.g. exercise 4x/week). */
  target_weekly: number | null;
  /** Unit label for quantity/time habits (e.g. "min", "L", "pág"). */
  unit: string;
  archived: boolean;
  sort_order: number;
  created_at: string;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  value: number;
  completed: boolean;
  created_at: string;
}

export type GoalStatus = "active" | "completed" | "archived";

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  color: string;
  start_date: string;
  due_date: string;
  target_value: number;
  current_value: number;
  unit: string;
  status: GoalStatus;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  date: string; // YYYY-MM-DD
  start_min: number; // minutes since midnight
  end_min: number;
  color: string;
  category: string;
  habit_id: string | null;
  notes: string;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  mood: number | null; // 1..5
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  points: number;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export type PlanCategory = "work" | "study" | "exercise" | "leisure" | "personal" | "other";

export interface PlanActivity {
  name: string;
  minutes: number;
  category: PlanCategory;
  /** Optional fixed start time "HH:MM". */
  fixed?: string | null;
}

export type BlockKind =
  | "activity"
  | "meal"
  | "break"
  | "leisure"
  | "free"
  | "sleep-buffer";

export interface ScheduleBlock {
  start_min: number;
  end_min: number;
  title: string;
  kind: BlockKind;
  category: PlanCategory;
}

export interface PlannerResult {
  blocks: ScheduleBlock[];
  awakeMinutes: number;
  allocatedMinutes: number;
  warnings: string[];
}

export interface DataSnapshot {
  habits: Habit[];
  logs: HabitLog[];
  goals: Goal[];
  events: CalendarEvent[];
  journal: JournalEntry[];
  profile: Profile | null;
}
