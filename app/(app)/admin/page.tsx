"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  CheckCircle2,
  Ban,
  Loader2,
  ListChecks,
  Target,
  Activity,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty";
import { fetchAdminUsers, setUserActive, type AdminUserRow } from "@/lib/admin";
import { formatDate } from "@/lib/utils";

function Metric({ icon: Icon, value, label }: { icon: typeof Users; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted">
      <Icon size={13} className="text-muted-2" />
      <span className="font-medium text-foreground">{value}</span>
      <span className="text-muted-2">{label}</span>
    </div>
  );
}

export default function AdminPage() {
  const { user, isAdmin, roleLoading, loading, mode } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState<AdminUserRow | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const allowed = mode === "supabase" && isAdmin;

  useEffect(() => {
    if (!loading && !roleLoading && !isAdmin) router.replace("/dashboard");
  }, [loading, roleLoading, isAdmin, router]);

  const load = useMemo(
    () => async () => {
      setBusy(true);
      setError(null);
      try {
        setRows(await fetchAdminUsers());
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudieron cargar las cuentas.");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  const toggle = async (row: AdminUserRow, next: boolean) => {
    setToggling(row.id);
    try {
      await setUserActive(row.id, next);
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, is_active: next } : r)));
      toast(next ? "Cuenta reactivada." : "Cuenta desactivada.", next ? "success" : "info");
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo actualizar.", "warning");
    } finally {
      setToggling(null);
      setConfirm(null);
    }
  };

  const filtered = rows.filter((r) => {
    const q = query.trim().toLowerCase();
    return !q || r.display_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
  });

  const total = rows.length;
  const active = rows.filter((r) => r.is_active).length;

  if (loading || roleLoading || !isAdmin) {
    return (
      <div className="flex h-64 items-center justify-center text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Administración"
        subtitle="Gestioná las cuentas de la plataforma."
        action={
          <Button variant="secondary" onClick={load} disabled={busy}>
            <RefreshCw size={16} className={busy ? "animate-spin" : ""} /> Actualizar
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted">
            <Users size={15} className="text-primary" />
            <span className="text-xs font-medium">Cuentas</span>
          </div>
          <p className="mt-1.5 text-2xl font-semibold">{total}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted">
            <CheckCircle2 size={15} className="text-success" />
            <span className="text-xs font-medium">Activas</span>
          </div>
          <p className="mt-1.5 text-2xl font-semibold">{active}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted">
            <Ban size={15} className="text-danger" />
            <span className="text-xs font-medium">Inactivas</span>
          </div>
          <p className="mt-1.5 text-2xl font-semibold">{total - active}</p>
        </Card>
      </div>

      {total > 0 && (
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o email…"
          className="mb-4"
        />
      )}

      {error ? (
        <Card className="border-danger/30 bg-danger/5 p-5 text-sm text-danger">
          {error}
          <p className="mt-2 text-xs text-muted">
            Si recién configuraste el admin, asegurate de haber ejecutado <code>supabase/admin.sql</code> en
            Supabase.
          </p>
        </Card>
      ) : busy && !rows.length ? (
        <div className="flex h-40 items-center justify-center text-muted">
          <Loader2 className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="Sin cuentas" description="Todavía no hay usuarios registrados." />
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const self = row.id === user?.id;
            const initial = (row.display_name || row.email || "U").charAt(0).toUpperCase();
            return (
              <Card key={row.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${
                        row.is_active
                          ? "bg-gradient-to-br from-primary to-secondary"
                          : "bg-surface-2 text-muted-2"
                      }`}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {row.display_name}
                        </span>
                        {row.is_admin && (
                          <Badge color="#6e7ff2">
                            <Shield size={11} /> Admin
                          </Badge>
                        )}
                        {self && <span className="text-[11px] text-muted-2">(vos)</span>}
                        {!row.is_active && <Badge color="#ef4444">Desactivada</Badge>}
                      </div>
                      <p className="truncate text-xs text-muted-2">{row.email}</p>
                    </div>
                  </div>

                  {row.is_admin ? (
                    <span className="text-xs text-muted-2">No editable</span>
                  ) : row.is_active ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setConfirm(row)}
                      disabled={toggling === row.id}
                    >
                      {toggling === row.id ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                      Desactivar
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggle(row, true)}
                      disabled={toggling === row.id}
                    >
                      {toggling === row.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      Reactivar
                    </Button>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3">
                  <Metric icon={ListChecks} value={row.habitCount} label="hábitos" />
                  <Metric icon={Target} value={`${row.completedGoals}/${row.goalCount}`} label="objetivos" />
                  <Metric icon={Activity} value={row.logCount} label="registros" />
                  <Metric
                    icon={CheckCircle2}
                    value={row.lastActivity ? formatDate(row.lastActivity) : "—"}
                    label="últ. actividad"
                  />
                  <span className="text-xs text-muted-2">
                    Miembro desde {formatDate(new Date(row.created_at))}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Desactivar cuenta"
        description="El usuario no podrá iniciar sesión hasta que la reactives. Sus datos se conservan."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => confirm && toggle(confirm, false)}>
              Desactivar
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Vas a desactivar a <span className="font-medium text-foreground">{confirm?.display_name}</span> (
          {confirm?.email}).
        </p>
      </Dialog>
    </div>
  );
}
