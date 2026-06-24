import { getSupabase } from "@/lib/supabase/client";

export interface AdminUserRow {
  id: string;
  email: string;
  display_name: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  habitCount: number;
  goalCount: number;
  completedGoals: number;
  logCount: number;
  lastActivity: string | null;
}

/** Fetch every user with aggregated metrics (admin-only, enforced by RLS). */
export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const [profiles, habits, goals, logs] = await Promise.all([
    sb.from("profiles").select("id, email, display_name, is_admin, is_active, created_at"),
    sb.from("habits").select("user_id"),
    sb.from("goals").select("user_id, status"),
    sb.from("habit_logs").select("user_id, date"),
  ]);

  if (profiles.error) throw profiles.error;

  const habitCount = new Map<string, number>();
  (habits.data ?? []).forEach((h: { user_id: string }) =>
    habitCount.set(h.user_id, (habitCount.get(h.user_id) ?? 0) + 1),
  );

  const goalCount = new Map<string, number>();
  const goalDone = new Map<string, number>();
  (goals.data ?? []).forEach((g: { user_id: string; status: string }) => {
    goalCount.set(g.user_id, (goalCount.get(g.user_id) ?? 0) + 1);
    if (g.status === "completed") goalDone.set(g.user_id, (goalDone.get(g.user_id) ?? 0) + 1);
  });

  const logCount = new Map<string, number>();
  const lastLog = new Map<string, string>();
  (logs.data ?? []).forEach((l: { user_id: string; date: string }) => {
    logCount.set(l.user_id, (logCount.get(l.user_id) ?? 0) + 1);
    const cur = lastLog.get(l.user_id);
    if (!cur || l.date > cur) lastLog.set(l.user_id, l.date);
  });

  return (profiles.data ?? [])
    .map((p): AdminUserRow => ({
      id: p.id,
      email: p.email ?? "",
      display_name: p.display_name ?? "Usuario",
      is_admin: Boolean(p.is_admin),
      is_active: p.is_active !== false,
      created_at: p.created_at,
      habitCount: habitCount.get(p.id) ?? 0,
      goalCount: goalCount.get(p.id) ?? 0,
      completedGoals: goalDone.get(p.id) ?? 0,
      logCount: logCount.get(p.id) ?? 0,
      lastActivity: lastLog.get(p.id) ?? null,
    }))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

/** Activate / deactivate a user account (admin-only). */
export async function setUserActive(id: string, active: boolean): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from("profiles").update({ is_active: active }).eq("id", id);
  if (error) throw error;
}
