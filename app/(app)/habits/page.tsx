"use client";

import { useMemo, useState } from "react";
import { Plus, ListChecks, Pencil, Trash2, Archive, Flame, Trophy } from "lucide-react";
import { useData } from "@/components/data-provider";
import { useToast } from "@/components/toast-provider";
import { HabitItem } from "@/components/habit-item";
import { HabitDialog } from "@/components/habit-dialog";
import { Heatmap } from "@/components/charts/heatmap";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty";
import type { Habit } from "@/lib/types";
import { habitHeatmap, habitStreak } from "@/lib/stats";
import { addDays, toDateKey, todayKey, cn, SHORT_WEEKDAYS } from "@/lib/utils";

function DayStrip({ value, onChange }: { value: string; onChange: (k: string) => void }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i - 6));
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {days.map((d) => {
        const key = toDateKey(d);
        const active = key === value;
        const isToday = key === todayKey();
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "flex min-w-[3rem] flex-1 flex-col items-center rounded-xl border px-2 py-2 transition",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface text-muted hover:border-border-strong",
            )}
          >
            <span className="text-[10px] uppercase">{SHORT_WEEKDAYS[(d.getDay() + 6) % 7]}</span>
            <span className="mt-0.5 text-sm font-semibold">{d.getDate()}</span>
            {isToday && <span className="mt-0.5 h-1 w-1 rounded-full bg-primary" />}
          </button>
        );
      })}
    </div>
  );
}

function HabitCard({
  habit,
  dateKey,
  onMenu,
}: {
  habit: Habit;
  dateKey: string;
  onMenu: () => void;
}) {
  const { logs } = useData();
  const cells = habitHeatmap(habit, logs, 28);
  const { current, best } = habitStreak(habit, logs);

  return (
    <Card className="overflow-hidden">
      <HabitItem habit={habit} dateKey={dateKey} onMenu={onMenu} />
      <div className="flex items-center gap-4 border-t border-border px-3.5 py-3">
        <div className="flex-1">
          <Heatmap cells={cells} color={habit.color} columns={14} />
        </div>
        <div className="flex shrink-0 flex-col gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 text-warning">
            <Flame size={13} /> {current} actual
          </span>
          <span className="inline-flex items-center gap-1 text-muted">
            <Trophy size={13} /> {best} récord
          </span>
        </div>
      </div>
    </Card>
  );
}

export default function HabitsPage() {
  const { habits, deleteHabit, saveHabit } = useData();
  const toast = useToast();
  const [dateKey, setDateKey] = useState(todayKey());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [actions, setActions] = useState<Habit | null>(null);
  const [confirmDel, setConfirmDel] = useState<Habit | null>(null);

  const active = useMemo(
    () => habits.filter((h) => !h.archived).sort((a, b) => a.sort_order - b.sort_order),
    [habits],
  );
  const archived = habits.filter((h) => h.archived);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (h: Habit) => {
    setActions(null);
    setEditing(h);
    setDialogOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Hábitos"
        subtitle="Tu sistema diario. Tocá para registrar el progreso."
        action={
          <Button onClick={openNew}>
            <Plus size={17} /> Nuevo
          </Button>
        }
      />

      <div className="mb-5">
        <DayStrip value={dateKey} onChange={setDateKey} />
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Todavía no hay hábitos"
          description="Creá hábitos de tipo sí/no, cantidad o tiempo para empezar a construir tus rachas."
          action={
            <Button onClick={openNew}>
              <Plus size={17} /> Crear hábito
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {active.map((h) => (
            <HabitCard key={h.id} habit={h} dateKey={dateKey} onMenu={() => setActions(h)} />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-muted">Archivados</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {archived.map((h) => (
              <Card key={h.id} className="flex items-center justify-between p-3.5">
                <span className="flex items-center gap-2 text-sm text-muted">
                  <span className="h-2 w-2 rounded-full" style={{ background: h.color }} />
                  {h.name}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      saveHabit({ id: h.id, name: h.name, archived: false });
                      toast("Hábito restaurado.");
                    }}
                  >
                    Restaurar
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDel(h)}>
                    <Trash2 size={15} className="text-danger" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <HabitDialog open={dialogOpen} onClose={() => setDialogOpen(false)} habit={editing} />

      {/* Actions sheet */}
      <Dialog
        open={!!actions}
        onClose={() => setActions(null)}
        title={actions?.name ?? ""}
        description="¿Qué querés hacer con este hábito?"
        size="sm"
      >
        <div className="flex flex-col gap-2">
          <Button variant="secondary" className="justify-start" onClick={() => actions && openEdit(actions)}>
            <Pencil size={16} /> Editar
          </Button>
          <Button
            variant="secondary"
            className="justify-start"
            onClick={() => {
              if (actions) {
                saveHabit({ id: actions.id, name: actions.name, archived: true });
                toast("Hábito archivado.");
              }
              setActions(null);
            }}
          >
            <Archive size={16} /> Archivar
          </Button>
          <Button
            variant="danger"
            className="justify-start"
            onClick={() => {
              setConfirmDel(actions);
              setActions(null);
            }}
          >
            <Trash2 size={16} /> Eliminar
          </Button>
        </div>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title="Eliminar hábito"
        description="Se borrará el hábito y todo su historial. Esta acción no se puede deshacer."
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
                  deleteHabit(confirmDel.id);
                  toast("Hábito eliminado.", "info");
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
          Vas a eliminar <span className="font-medium text-foreground">{confirmDel?.name}</span>.
        </p>
      </Dialog>
    </div>
  );
}
