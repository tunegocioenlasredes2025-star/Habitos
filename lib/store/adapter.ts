import type { DataSnapshot } from "@/lib/types";

export type TableName =
  | "habits"
  | "habit_logs"
  | "goals"
  | "calendar_events"
  | "journal"
  | "profiles";

export interface StoreAdapter {
  mode: "local" | "supabase";
  fetchAll(userId: string): Promise<DataSnapshot>;
  put<T extends { id: string }>(table: TableName, row: T): Promise<void>;
  remove(table: TableName, id: string): Promise<void>;
}

export const EMPTY_SNAPSHOT: DataSnapshot = {
  habits: [],
  logs: [],
  goals: [],
  events: [],
  journal: [],
  profile: null,
};
