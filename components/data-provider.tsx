"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CalendarEvent,
  DataSnapshot,
  Goal,
  Habit,
  HabitLog,
  JournalEntry,
  ScheduleBlock,
} from "@/lib/types";
import { getAdapter } from "@/lib/store";
import { EMPTY_SNAPSHOT } from "@/lib/store/adapter";
import { isDayComplete, valueFor } from "@/lib/stats";
import { todayKey, uid } from "@/lib/utils";
import { useAuth } from "./auth-provider";

interface DataContextValue extends DataSnapshot {
  ready: boolean;
  // Habits
  saveHabit: (h: Partial<Habit> & { name: string }) => void;
  deleteHabit: (id: string) => void;
  reorderHabits: (ids: string[]) => void;
  // Logs
  setLog: (habit: Habit, dateKey: string, value: number) => void;
  toggleHabit: (habit: Habit, dateKey?: string) => void;
  // Goals
  saveGoal: (g: Partial<Goal> & { title: string }) => void;
  deleteGoal: (id: string) => void;
  // Events
  saveEvent: (e: Partial<CalendarEvent> & { title: string; date: string }) => void;
  deleteEvent: (id: string) => void;
  applyPlanToCalendar: (dateKey: string, blocks: ScheduleBlock[]) => number;
  // Journal
  saveEntry: (e: Partial<JournalEntry> & { date: string }) => void;
  deleteEntry: (id: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const adapter = useMemo(() => getAdapter(), []);
  const [snap, setSnap] = useState<DataSnapshot>(EMPTY_SNAPSHOT);
  const [ready, setReady] = useState(false);
  const userId = user?.id ?? null;

  useEffect(() => {
    let active = true;
    if (!userId) {
      setSnap(EMPTY_SNAPSHOT);
      setReady(false);
      return;
    }
    setReady(false);
    adapter.fetchAll(userId).then((data) => {
      if (active) {
        setSnap(data);
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, [userId, adapter]);

  // Persist helper — optimistic state + adapter write.
  const put = useCallback(
    async <T extends { id: string }>(
      table: Parameters<typeof adapter.put>[0],
      row: T,
    ) => {
      try {
        await adapter.put(table, row);
      } catch (e) {
        console.error("persist failed", e);
      }
    },
    [adapter],
  );

  const remove = useCallback(
    async (table: Parameters<typeof adapter.remove>[0], id: string) => {
      try {
        await adapter.remove(table, id);
      } catch (e) {
        console.error("delete failed", e);
      }
    },
    [adapter],
  );

  // ---------------- Habits ----------------
  const saveHabit: DataContextValue["saveHabit"] = useCallback(
    (input) => {
      if (!userId) return;
      setSnap((s) => {
        const existing = input.id ? s.habits.find((h) => h.id === input.id) : null;
        const habit: Habit = {
          id: existing?.id ?? uid("habit"),
          user_id: userId,
          name: input.name,
          category: input.category ?? existing?.category ?? "Otro",
          type: input.type ?? existing?.type ?? "boolean",
          frequency: input.frequency ?? existing?.frequency ?? "daily",
          days: input.days ?? existing?.days ?? [0, 1, 2, 3, 4, 5, 6],
          color: input.color ?? existing?.color ?? "#4f8cff",
          target_daily: input.target_daily ?? existing?.target_daily ?? 1,
          target_weekly: input.target_weekly ?? existing?.target_weekly ?? null,
          unit: input.unit ?? existing?.unit ?? "",
          archived: input.archived ?? existing?.archived ?? false,
          sort_order: existing?.sort_order ?? s.habits.length,
          created_at: existing?.created_at ?? new Date().toISOString(),
        };
        void put("habits", habit);
        const habits = existing
          ? s.habits.map((h) => (h.id === habit.id ? habit : h))
          : [...s.habits, habit];
        return { ...s, habits };
      });
    },
    [userId, put],
  );

  const deleteHabit: DataContextValue["deleteHabit"] = useCallback(
    (id) => {
      setSnap((s) => {
        void remove("habits", id);
        s.logs.filter((l) => l.habit_id === id).forEach((l) => void remove("habit_logs", l.id));
        return {
          ...s,
          habits: s.habits.filter((h) => h.id !== id),
          logs: s.logs.filter((l) => l.habit_id !== id),
        };
      });
    },
    [remove],
  );

  const reorderHabits: DataContextValue["reorderHabits"] = useCallback(
    (ids) => {
      setSnap((s) => {
        const habits = s.habits.map((h) => {
          const idx = ids.indexOf(h.id);
          const next = idx >= 0 ? { ...h, sort_order: idx } : h;
          if (idx >= 0) void put("habits", next);
          return next;
        });
        return { ...s, habits };
      });
    },
    [put],
  );

  // ---------------- Logs ----------------
  const setLog: DataContextValue["setLog"] = useCallback(
    (habit, dateKey, value) => {
      if (!userId) return;
      setSnap((s) => {
        const existing = s.logs.find((l) => l.habit_id === habit.id && l.date === dateKey);
        const completed = isDayComplete(habit, value);
        const log: HabitLog = {
          id: existing?.id ?? uid("log"),
          user_id: userId,
          habit_id: habit.id,
          date: dateKey,
          value,
          completed,
          created_at: existing?.created_at ?? new Date().toISOString(),
        };
        if (value <= 0 && existing) {
          void remove("habit_logs", existing.id);
          return { ...s, logs: s.logs.filter((l) => l.id !== existing.id) };
        }
        void put("habit_logs", log);
        const logs = existing
          ? s.logs.map((l) => (l.id === log.id ? log : l))
          : [...s.logs, log];
        return { ...s, logs };
      });
    },
    [userId, put, remove],
  );

  const toggleHabit: DataContextValue["toggleHabit"] = useCallback(
    (habit, dateKey = todayKey()) => {
      const current = valueFor(snap.logs, habit.id, dateKey);
      if (habit.type === "boolean") {
        setLog(habit, dateKey, current >= 1 ? 0 : 1);
      } else {
        // cycle: 0 → target → 0 (quick complete toggle)
        setLog(habit, dateKey, current >= habit.target_daily ? 0 : habit.target_daily);
      }
    },
    [snap.logs, setLog],
  );

  // ---------------- Goals ----------------
  const saveGoal: DataContextValue["saveGoal"] = useCallback(
    (input) => {
      if (!userId) return;
      setSnap((s) => {
        const existing = input.id ? s.goals.find((g) => g.id === input.id) : null;
        const target = input.target_value ?? existing?.target_value ?? 1;
        const current = input.current_value ?? existing?.current_value ?? 0;
        const goal: Goal = {
          id: existing?.id ?? uid("goal"),
          user_id: userId,
          title: input.title,
          description: input.description ?? existing?.description ?? "",
          category: input.category ?? existing?.category ?? "Personal",
          color: input.color ?? existing?.color ?? "#6e7ff2",
          start_date: input.start_date ?? existing?.start_date ?? todayKey(),
          due_date: input.due_date ?? existing?.due_date ?? todayKey(),
          target_value: target,
          current_value: current,
          unit: input.unit ?? existing?.unit ?? "",
          status: input.status ?? (current >= target ? "completed" : existing?.status ?? "active"),
          created_at: existing?.created_at ?? new Date().toISOString(),
        };
        if (goal.current_value >= goal.target_value && goal.status === "active") {
          goal.status = "completed";
        }
        void put("goals", goal);
        const goals = existing
          ? s.goals.map((g) => (g.id === goal.id ? goal : g))
          : [...s.goals, goal];
        return { ...s, goals };
      });
    },
    [userId, put],
  );

  const deleteGoal: DataContextValue["deleteGoal"] = useCallback(
    (id) => {
      setSnap((s) => {
        void remove("goals", id);
        return { ...s, goals: s.goals.filter((g) => g.id !== id) };
      });
    },
    [remove],
  );

  // ---------------- Events ----------------
  const saveEvent: DataContextValue["saveEvent"] = useCallback(
    (input) => {
      if (!userId) return;
      setSnap((s) => {
        const existing = input.id ? s.events.find((e) => e.id === input.id) : null;
        const event: CalendarEvent = {
          id: existing?.id ?? uid("event"),
          user_id: userId,
          title: input.title,
          date: input.date,
          start_min: input.start_min ?? existing?.start_min ?? 9 * 60,
          end_min: input.end_min ?? existing?.end_min ?? 10 * 60,
          color: input.color ?? existing?.color ?? "#4f8cff",
          category: input.category ?? existing?.category ?? "Otro",
          habit_id: input.habit_id ?? existing?.habit_id ?? null,
          notes: input.notes ?? existing?.notes ?? "",
          created_at: existing?.created_at ?? new Date().toISOString(),
        };
        void put("calendar_events", event);
        const events = existing
          ? s.events.map((e) => (e.id === event.id ? event : e))
          : [...s.events, event];
        return { ...s, events };
      });
    },
    [userId, put],
  );

  const deleteEvent: DataContextValue["deleteEvent"] = useCallback(
    (id) => {
      setSnap((s) => {
        void remove("calendar_events", id);
        return { ...s, events: s.events.filter((e) => e.id !== id) };
      });
    },
    [remove],
  );

  const applyPlanToCalendar: DataContextValue["applyPlanToCalendar"] = useCallback(
    (dateKey, blocks) => {
      if (!userId) return 0;
      let count = 0;
      setSnap((s) => {
        // Replace any previously generated plan for that day.
        const kept = s.events.filter((e) => !(e.date === dateKey && e.category === "Plan"));
        s.events
          .filter((e) => e.date === dateKey && e.category === "Plan")
          .forEach((e) => void remove("calendar_events", e.id));

        const created: CalendarEvent[] = blocks
          .filter((b) => b.kind !== "free")
          .map((b) => {
            count++;
            const ev: CalendarEvent = {
              id: uid("event"),
              user_id: userId,
              title: b.title,
              date: dateKey,
              start_min: b.start_min % 1440,
              end_min: ((b.end_min - 1) % 1440) + 1,
              color: blockColor(b),
              category: "Plan",
              habit_id: null,
              notes: "Generado por el Planificador Inteligente",
              created_at: new Date().toISOString(),
            };
            void put("calendar_events", ev);
            return ev;
          });
        return { ...s, events: [...kept, ...created] };
      });
      return count;
    },
    [userId, put, remove],
  );

  // ---------------- Journal ----------------
  const saveEntry: DataContextValue["saveEntry"] = useCallback(
    (input) => {
      if (!userId) return;
      setSnap((s) => {
        const existing = input.id ? s.journal.find((j) => j.id === input.id) : null;
        const now = new Date().toISOString();
        const entry: JournalEntry = {
          id: existing?.id ?? uid("note"),
          user_id: userId,
          date: input.date,
          title: input.title ?? existing?.title ?? "",
          content: input.content ?? existing?.content ?? "",
          mood: input.mood ?? existing?.mood ?? null,
          created_at: existing?.created_at ?? now,
          updated_at: now,
        };
        void put("journal", entry);
        const journal = existing
          ? s.journal.map((j) => (j.id === entry.id ? entry : j))
          : [...s.journal, entry];
        return { ...s, journal };
      });
    },
    [userId, put],
  );

  const deleteEntry: DataContextValue["deleteEntry"] = useCallback(
    (id) => {
      setSnap((s) => {
        void remove("journal", id);
        return { ...s, journal: s.journal.filter((j) => j.id !== id) };
      });
    },
    [remove],
  );

  const value: DataContextValue = {
    ...snap,
    ready,
    saveHabit,
    deleteHabit,
    reorderHabits,
    setLog,
    toggleHabit,
    saveGoal,
    deleteGoal,
    saveEvent,
    deleteEvent,
    applyPlanToCalendar,
    saveEntry,
    deleteEntry,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function blockColor(b: ScheduleBlock): string {
  const map: Record<string, string> = {
    work: "#4f8cff",
    study: "#6e7ff2",
    exercise: "#22c55e",
    leisure: "#f59e0b",
    personal: "#f472b6",
    other: "#94a3b8",
  };
  if (b.kind === "meal") return "#f472b6";
  if (b.kind === "break") return "#38bdf8";
  return map[b.category] ?? "#94a3b8";
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
