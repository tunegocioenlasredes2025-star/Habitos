import type { DataSnapshot } from "@/lib/types";
import { EMPTY_SNAPSHOT, type StoreAdapter, type TableName } from "./adapter";

const KEY = (userId: string) => `momentum:data:${userId}`;

const TABLE_FIELD: Record<TableName, keyof DataSnapshot | "profile"> = {
  habits: "habits",
  habit_logs: "logs",
  goals: "goals",
  calendar_events: "events",
  journal: "journal",
  profiles: "profile",
};

function read(userId: string): DataSnapshot {
  if (typeof window === "undefined") return { ...EMPTY_SNAPSHOT };
  try {
    const raw = window.localStorage.getItem(KEY(userId));
    if (!raw) return { ...EMPTY_SNAPSHOT };
    const parsed = JSON.parse(raw) as Partial<DataSnapshot>;
    return { ...EMPTY_SNAPSHOT, ...parsed };
  } catch {
    return { ...EMPTY_SNAPSHOT };
  }
}

function write(userId: string, snap: DataSnapshot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY(userId), JSON.stringify(snap));
}

/** Browser-local persistence — the default, zero-config mode. */
export const localAdapter: StoreAdapter = {
  mode: "local",

  async fetchAll(userId) {
    return read(userId);
  },

  async put(table, row) {
    // userId travels on the row (user_id) — local storage is keyed by it.
    const userId = (row as { user_id?: string; id: string }).user_id;
    if (!userId) {
      // profiles row: id IS the user id
      const snap = read(row.id);
      snap.profile = row as unknown as DataSnapshot["profile"];
      write(row.id, snap);
      return;
    }
    const snap = read(userId);
    const field = TABLE_FIELD[table] as Exclude<keyof DataSnapshot, "profile">;
    const list = (snap[field] as { id: string }[]).slice();
    const idx = list.findIndex((r) => r.id === row.id);
    if (idx >= 0) list[idx] = row;
    else list.push(row);
    (snap as unknown as Record<string, unknown>)[field] = list;
    write(userId, snap);
  },

  async remove(table, id) {
    // We don't know the userId here without scanning; rows carry user_id, so
    // the provider passes the active user via a closure — but to stay simple,
    // we search every momentum key.
    if (typeof window === "undefined") return;
    const field = TABLE_FIELD[table] as Exclude<keyof DataSnapshot, "profile">;
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith("momentum:data:")) continue;
      const userId = k.replace("momentum:data:", "");
      const snap = read(userId);
      const list = snap[field] as { id: string }[];
      const next = list.filter((r) => r.id !== id);
      if (next.length !== list.length) {
        (snap as unknown as Record<string, unknown>)[field] = next;
        write(userId, snap);
        return;
      }
    }
  },
};
