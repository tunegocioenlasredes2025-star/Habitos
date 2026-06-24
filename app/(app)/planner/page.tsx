"use client";

import { useMemo, useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Sunrise,
  Moon,
  Wand2,
  CalendarPlus,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useData } from "@/components/data-provider";
import { useToast } from "@/components/toast-provider";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/label";
import { planDay } from "@/lib/planner";
import { PLAN_CATEGORY_META, BLOCK_META } from "@/lib/constants";
import type { PlanActivity, PlanCategory, PlannerResult, ScheduleBlock } from "@/lib/types";
import { minutesToTime, uid, todayKey } from "@/lib/utils";

interface Row extends PlanActivity {
  id: string;
}

const PRESETS: Omit<Row, "id">[] = [
  { name: "Trabajo", minutes: 240, category: "work" },
  { name: "Estudio", minutes: 120, category: "study" },
  { name: "Gimnasio", minutes: 60, category: "exercise" },
  { name: "Lectura", minutes: 30, category: "leisure" },
];

const CAT_OPTS: { value: PlanCategory; label: string }[] = (
  Object.keys(PLAN_CATEGORY_META) as PlanCategory[]
).map((k) => ({ value: k, label: PLAN_CATEGORY_META[k].label }));

function blockColor(b: ScheduleBlock): string {
  if (b.kind === "activity") return PLAN_CATEGORY_META[b.category].color;
  return BLOCK_META[b.kind]?.color ?? "#94a3b8";
}

function blockTag(b: ScheduleBlock): string {
  if (b.kind === "activity") return PLAN_CATEGORY_META[b.category].label;
  return BLOCK_META[b.kind]?.label ?? "";
}

export default function PlannerPage() {
  const { applyPlanToCalendar } = useData();
  const toast = useToast();
  const [wake, setWake] = useState("08:00");
  const [sleep, setSleep] = useState("23:00");
  const [rows, setRows] = useState<Row[]>([
    { id: uid("a"), name: "Trabajo", minutes: 240, category: "work" },
    { id: uid("a"), name: "Estudio", minutes: 120, category: "study" },
    { id: uid("a"), name: "Gimnasio", minutes: 60, category: "exercise" },
  ]);
  const [result, setResult] = useState<PlannerResult | null>(null);

  const addRow = (preset?: Omit<Row, "id">) =>
    setRows((r) => [...r, { id: uid("a"), name: "", minutes: 60, category: "personal", ...preset }]);

  const update = (id: string, patch: Partial<Row>) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const removeRow = (id: string) => setRows((r) => r.filter((x) => x.id !== id));

  const generate = () => {
    const activities: PlanActivity[] = rows
      .filter((r) => r.name.trim() && r.minutes > 0)
      .map((r) => ({ name: r.name, minutes: r.minutes, category: r.category, fixed: r.fixed || null }));
    if (!activities.length) {
      toast("Agregá al menos una actividad.", "warning");
      return;
    }
    const res = planDay({ wake, sleep, activities });
    setResult(res);
    toast("Cronograma generado.");
  };

  const freeMin = result ? result.awakeMinutes - result.allocatedMinutes : 0;
  const usedPresets = useMemo(() => new Set(rows.map((r) => r.name)), [rows]);

  return (
    <div>
      <PageHeader
        title="Planificador Inteligente"
        subtitle="Decile qué querés hacer y armamos un día equilibrado, con descansos y ocio."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Inputs */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Me despierto">
                <div className="relative">
                  <Sunrise size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-warning" />
                  <Input type="time" value={wake} onChange={(e) => setWake(e.target.value)} className="pl-9" />
                </div>
              </Field>
              <Field label="Me duermo">
                <div className="relative">
                  <Moon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                  <Input type="time" value={sleep} onChange={(e) => setSleep(e.target.value)} className="pl-9" />
                </div>
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Actividades</h2>
              <span className="text-xs text-muted-2">{rows.length}</span>
            </div>

            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-surface-2 p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={r.name}
                      onChange={(e) => update(r.id, { name: e.target.value })}
                      placeholder="Actividad"
                      className="flex-1"
                    />
                    <button
                      onClick={() => removeRow(r.id)}
                      className="shrink-0 rounded-lg p-2 text-muted-2 transition hover:text-danger"
                      aria-label="Quitar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
                    <Select
                      value={r.category}
                      onChange={(e) => update(r.id, { category: e.target.value as PlanCategory })}
                    >
                      {CAT_OPTS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </Select>
                    <div className="relative">
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        value={r.minutes}
                        onChange={(e) => update(r.id, { minutes: Number(e.target.value) })}
                        className="pr-9"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-2">
                        min
                      </span>
                    </div>
                    <Input
                      type="time"
                      value={r.fixed ?? ""}
                      onChange={(e) => update(r.id, { fixed: e.target.value || null })}
                      title="Hora fija (opcional)"
                      className="w-[7.5rem]"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => addRow()}>
                <Plus size={15} /> Agregar
              </Button>
              {PRESETS.filter((p) => !usedPresets.has(p.name)).map((p) => (
                <Button key={p.name} variant="ghost" size="sm" onClick={() => addRow(p)}>
                  <Plus size={13} /> {p.name}
                </Button>
              ))}
            </div>

            <Button onClick={generate} size="lg" className="mt-4 w-full">
              <Wand2 size={17} /> Generar cronograma
            </Button>
          </Card>
        </div>

        {/* Result */}
        <div className="lg:col-span-3">
          {!result ? (
            <Card className="flex h-full min-h-[20rem] flex-col items-center justify-center p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary">
                <Sparkles size={22} className="text-white" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">Tu día, optimizado</h3>
              <p className="mt-1 max-w-xs text-sm text-muted">
                Cargá tus actividades y generá un cronograma con bloques de foco, descansos, comidas y
                tiempo libre.
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              {/* Summary */}
              <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
                {[
                  { label: "Despierto", val: fmtH(result.awakeMinutes), color: "var(--foreground)" },
                  { label: "Asignado", val: fmtH(result.allocatedMinutes), color: "var(--primary)" },
                  { label: "Libre", val: fmtH(freeMin), color: "var(--success)" },
                ].map((s) => (
                  <div key={s.label} className="p-4 text-center">
                    <p className="text-lg font-semibold" style={{ color: s.color }}>
                      {s.val}
                    </p>
                    <p className="text-xs text-muted-2">{s.label}</p>
                  </div>
                ))}
              </div>

              {result.warnings.length > 0 && (
                <div className="space-y-1.5 border-b border-border bg-warning/[0.06] p-4">
                  {result.warnings.map((w, i) => (
                    <p key={i} className="flex items-start gap-2 text-xs text-warning">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                      {w}
                    </p>
                  ))}
                </div>
              )}

              {/* Timeline */}
              <div className="p-4">
                <div className="space-y-0">
                  {result.blocks.map((b, i) => {
                    const color = blockColor(b);
                    const dim = b.kind === "free" || b.kind === "break";
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="w-12 shrink-0 pt-2.5 text-right text-xs font-medium text-muted-2">
                          {minutesToTime(b.start_min)}
                        </div>
                        <div className="relative flex flex-col items-center">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                          {i < result.blocks.length - 1 && (
                            <span className="w-px flex-1" style={{ background: "var(--border)" }} />
                          )}
                        </div>
                        <div className={`flex-1 pb-3 ${dim ? "opacity-70" : ""}`}>
                          <div
                            className="rounded-lg border px-3 py-2"
                            style={{ borderColor: `${color}33`, background: `${color}0d` }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-foreground">{b.title}</span>
                              <span className="text-[11px] text-muted-2">
                                {fmtH(b.end_min - b.start_min)}
                              </span>
                            </div>
                            <span className="text-[11px]" style={{ color }}>
                              {blockTag(b)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex gap-3">
                    <div className="w-12 shrink-0 pt-1 text-right text-xs font-medium text-muted-2">
                      {sleep}
                    </div>
                    <div className="flex flex-col items-center">
                      <Moon size={14} className="text-secondary" />
                    </div>
                    <div className="flex-1 pt-0.5 text-sm text-muted">A dormir</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border p-4">
                <Button
                  className="w-full"
                  onClick={() => {
                    const n = applyPlanToCalendar(todayKey(), result.blocks);
                    toast(`${n} bloques agregados al calendario de hoy.`);
                  }}
                >
                  <CalendarPlus size={17} /> Agregar al calendario de hoy
                </Button>
                <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-2">
                  <Clock size={11} /> Reemplaza cualquier plan previo generado para hoy.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function fmtH(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
