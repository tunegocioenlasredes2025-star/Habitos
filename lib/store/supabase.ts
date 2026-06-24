import type {
  CalendarEvent,
  DataSnapshot,
  Goal,
  Habit,
  HabitLog,
  JournalEntry,
  Profile,
} from "@/lib/types";
import { getSupabase } from "@/lib/supabase/client";
import { EMPTY_SNAPSHOT, type StoreAdapter, type TableName } from "./adapter";

const SB_TABLE: Record<TableName, string> = {
  habits: "habits",
  habit_logs: "habit_logs",
  goals: "goals",
  calendar_events: "calendar_events",
  journal: "journal_entries",
  profiles: "profiles",
};

/** Supabase-backed persistence — active when env vars are set. */
export const supabaseAdapter: StoreAdapter = {
  mode: "supabase",

  async fetchAll(userId) {
    const sb = getSupabase();
    if (!sb) return { ...EMPTY_SNAPSHOT };

    const [habits, logs, goals, events, journal, profile] = await Promise.all([
      sb.from("habits").select("*").eq("user_id", userId),
      sb.from("habit_logs").select("*").eq("user_id", userId),
      sb.from("goals").select("*").eq("user_id", userId),
      sb.from("calendar_events").select("*").eq("user_id", userId),
      sb.from("journal_entries").select("*").eq("user_id", userId),
      sb.from("profiles").select("*").eq("id", userId).maybeSingle(),
    ]);

    const snap: DataSnapshot = {
      habits: (habits.data as Habit[]) ?? [],
      logs: (logs.data as HabitLog[]) ?? [],
      goals: (goals.data as Goal[]) ?? [],
      events: (events.data as CalendarEvent[]) ?? [],
      journal: (journal.data as JournalEntry[]) ?? [],
      profile: (profile.data as Profile) ?? null,
    };
    return snap;
  },

  async put(table, row) {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from(SB_TABLE[table]).upsert(row);
    if (error) throw error;
  },

  async remove(table, id) {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from(SB_TABLE[table]).delete().eq("id", id);
    if (error) throw error;
  },
};
