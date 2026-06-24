"use client";

import { useMemo, useState } from "react";
import { Plus, Target, Minus, Pencil, Trash2, CheckCircle2, CalendarClock } from "lucide-react";
import { useData } from "@/components/data-provider";
import { useToast } from "@/components/toast-provider";
import { GoalDialog } from "@/components/goal-dialog";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/empty";
import { Dialog } from "@/components/ui/dialog";
import type { Goal } from "@/lib/types";
import { daysBetween, fromDateKey, pct, formatDate } from "@/lib/utils";

function daysLeftLabel(due: string): { text: string; urgent: boolean } {
  const d = daysBetween(new Date(), fromDateKey(due));
  if (d < 0) return { text: `Venció hace ${-d}d`, urgent: true };
  if (d === 0) return { text: "Vence hoy", urgent: true };
  if (d <= 7) return { text: `${d}d restantes`, urgent: true };
  return { text: `${d}d restantes`, urgent: false };
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { saveGoal } = useData();
  const p = pct(goal.current_value, goal.target_value);
  const left = daysLeftLabel(goal.due_date);
  const completed = goal.status === "completed";
  const step = Math.max(1, Math.round(goal.target_value / 20));

  const bump = (delta: number) =>
    saveGoal({
      id: goal.id,
      title: goal.title,
      current_value: Math.min(goal.target_value, Math.max(0, goal.current_value + delta)),
      status: "active",
    });

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15px] font-semibold text-foreground">{goal.title}</h3>
            {completed && <CheckCircle2 size={16} className="shrink-0 text-success" />}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge color={goal.color}>{goal.category}</Badge>
            {!completed && (
              <span
                className={`inline-flex items-center gap-1 text-xs ${
                  left.urgent ? "text-warning" : "text-muted-2"
                }`}
              >
                <CalendarClock size={12} />
                {left.text}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Editar">
            <Pencil size={15} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Eliminar">
            <Trash2 size={15} className="text-danger" />
          </Button>
        </div>
      </div>

      {goal.description && <p className="mt-3 text-sm text-muted">{goal.description}</p>}

      <div className="mt-4">
        <div className="mb-2 flex items-end justify-between">
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            {goal.current_value}
            <span className="text-sm text-muted-2">
              {" "}
              / {goal.target_value} {goal.unit}
            </span>
          </span>
          <span className="text-sm font-medium" style={{ color: goal.color }}>
            {p}%
          </span>
        </div>
        <Progress value={p} color={goal.color} height={8} />
      </div>

      {!completed && (
        <div className="mt-4 flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => bump(-step)} className="flex-1">
            <Minus size={15} /> {step} {goal.unit}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => bump(step)} className="flex-1">
            <Plus size={15} /> {step} {goal.unit}
          </Button>
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted-2">
        {formatDate(goal.start_date)} → {formatDate(goal.due_date)}
      </p>
    </Card>
  );
}

export default function GoalsPage() {
  const { goals, deleteGoal } = useData();
  const toast = useToast();
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [confirmDel, setConfirmDel] = useState<Goal | null>(null);

  const filtered = useMemo(
    () =>
      goals
        .filter((g) => (tab === "active" ? g.status !== "completed" : g.status === "completed"))
        .sort((a, b) => a.due_date.localeCompare(b.due_date)),
    [goals, tab],
  );

  const completedCount = goals.filter((g) => g.status === "completed").length;

  return (
    <div>
      <PageHeader
        title="Objetivos"
        subtitle="Metas medibles con fecha límite y progreso real."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={17} /> Nuevo
          </Button>
        }
      />

      <Segmented
        className="mb-5"
        value={tab}
        onChange={setTab}
        options={[
          { value: "active", label: "Activos" },
          { value: "completed", label: `Completados${completedCount ? ` (${completedCount})` : ""}` },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Target}
          title={tab === "active" ? "Sin objetivos activos" : "Todavía no completaste objetivos"}
          description={
            tab === "active"
              ? "Definí una meta clara: leer 10 libros, ahorrar, entrenar 100 veces…"
              : "Cuando completes un objetivo aparecerá acá."
          }
          action={
            tab === "active" ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                <Plus size={17} /> Crear objetivo
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={() => {
                setEditing(g);
                setDialogOpen(true);
              }}
              onDelete={() => setConfirmDel(g)}
            />
          ))}
        </div>
      )}

      <GoalDialog open={dialogOpen} onClose={() => setDialogOpen(false)} goal={editing} />

      <Dialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title="Eliminar objetivo"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDel(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDel) {
                  deleteGoal(confirmDel.id);
                  toast("Objetivo eliminado.", "info");
                }
                setConfirmDel(null);
              }}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Vas a eliminar <span className="font-medium text-foreground">{confirmDel?.title}</span>.
        </p>
      </Dialog>
    </div>
  );
}
