"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Clock,
  TrendingUp,
  Quote,
  Plus,
  ListChecks,
  ArrowRight,
  Target,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useData } from "@/components/data-provider";
import { HabitItem } from "@/components/habit-item";
import { HabitDialog } from "@/components/habit-dialog";
import { Ring } from "@/components/charts/ring";
import { BarChart } from "@/components/charts/bars";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty";
import { overview, isScheduled } from "@/lib/stats";
import { computePoints, levelInfo, levelTitle, pointsToday } from "@/lib/gamification";
import { quoteOfDay } from "@/lib/quotes";
import { formatDate, todayKey, pct } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted">
        <Icon size={15} style={{ color }} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-2">{sub}</p>}
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { habits, logs, goals, ready } = useData();
  const [open, setOpen] = useState(false);
  const today = todayKey();

  const data = useMemo(() => overview(habits, logs), [habits, logs]);
  const points = useMemo(() => computePoints(habits, logs, goals), [habits, logs, goals]);
  const lvl = levelInfo(points);
  const earnedToday = pointsToday(habits, logs);
  const quote = quoteOfDay();

  const todayHabits = habits
    .filter((h) => !h.archived && isScheduled(h, today))
    .sort((a, b) => a.sort_order - b.sort_order);
  const activeGoals = goals.filter((g) => g.status === "active").slice(0, 3);
  const firstName = (user?.display_name || "").split(" ")[0];

  if (!ready) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{formatDate(new Date(), { weekday: true, long: true })}</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-[28px]">
            {greeting()}{firstName ? `, ${firstName}` : ""}
          </h1>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-1.5">
          <Plus size={17} /> Nuevo hábito
        </Button>
      </div>

      {habits.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Empezá tu sistema"
          description="Creá tu primer hábito para empezar a medir tu progreso, rachas y estadísticas."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus size={17} /> Crear primer hábito
            </Button>
          }
        />
      ) : (
        <>
          {/* Hero */}
          <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
            <Card className="flex items-center gap-5 p-5">
              <Ring
                value={data.todayPct}
                label={`${data.todayPct}%`}
                sublabel="del día"
                color={data.todayPct >= 100 ? "var(--success)" : "var(--primary)"}
              />
              <div className="space-y-1">
                <p className="text-sm text-muted">Hábitos de hoy</p>
                <p className="text-3xl font-semibold tracking-tight">
                  {data.todayDone}
                  <span className="text-lg text-muted-2">/{data.todayTotal}</span>
                </p>
                <p className="text-xs text-muted-2">
                  {data.todayTotal - data.todayDone === 0
                    ? "¡Día completo! Excelente."
                    : `Te faltan ${data.todayTotal - data.todayDone} para cerrar el día.`}
                </p>
                {earnedToday > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-[11px] font-medium text-secondary">
                    +{earnedToday} pts hoy
                  </span>
                )}
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
              <StatTile
                icon={Flame}
                label="Racha máxima"
                value={`${data.topStreak}`}
                sub={data.topStreak === 1 ? "día seguido" : "días seguidos"}
                color="var(--warning)"
              />
              <StatTile
                icon={TrendingUp}
                label="Constancia"
                value={`${data.weekAvg}%`}
                sub="últimos 7 días"
                color="var(--success)"
              />
              <StatTile
                icon={Clock}
                label="Tiempo productivo"
                value={`${Math.floor(data.productiveMin / 60)}h ${data.productiveMin % 60}m`}
                sub="registrado hoy"
                color="var(--primary)"
              />
              <Card className="col-span-2 p-4 sm:col-span-3 lg:col-span-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted">
                    <Trophy size={15} style={{ color: "var(--secondary)" }} />
                    <span className="text-xs font-medium">
                      Nivel {lvl.level} · {levelTitle(lvl.level)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-2">
                    {lvl.into}/{lvl.span} pts
                  </span>
                </div>
                <Progress value={lvl.pct} className="mt-2.5" height={6} color="var(--secondary)" />
              </Card>
            </div>
          </div>

          {/* Quote */}
          <Card className="flex items-start gap-3 p-5">
            <Quote size={18} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <p className="text-[15px] leading-relaxed text-foreground">{quote.text}</p>
              <p className="mt-1 text-xs text-muted-2">— {quote.author}</p>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Today's habits */}
            <div className="lg:col-span-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Para hoy</h2>
                <Link href="/habits" className="text-xs text-primary hover:underline">
                  Ver todos
                </Link>
              </div>
              {todayHabits.length === 0 ? (
                <Card className="p-6 text-center text-sm text-muted">
                  Hoy no tenés hábitos programados. Disfrutá el día.
                </Card>
              ) : (
                <div className="space-y-2">
                  {todayHabits.map((h) => (
                    <HabitItem key={h.id} habit={h} />
                  ))}
                </div>
              )}
            </div>

            {/* Side: week + goals */}
            <div className="space-y-6 lg:col-span-2">
              <Card className="p-5">
                <h2 className="mb-4 text-sm font-semibold text-foreground">Progreso semanal</h2>
                <BarChart data={data.week} />
              </Card>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Objetivos activos</h2>
                  <Link href="/goals" className="text-xs text-primary hover:underline">
                    Ver todos
                  </Link>
                </div>
                {activeGoals.length === 0 ? (
                  <Card className="flex flex-col items-center gap-3 p-5 text-center">
                    <Target size={20} className="text-muted-2" />
                    <p className="text-sm text-muted">Sin objetivos activos.</p>
                    <Link href="/goals">
                      <Button variant="secondary" size="sm">
                        Crear objetivo <ArrowRight size={14} />
                      </Button>
                    </Link>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {activeGoals.map((g) => {
                      const p = pct(g.current_value, g.target_value);
                      return (
                        <Link key={g.id} href="/goals">
                          <Card hover className="p-4">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-medium text-foreground">{g.title}</p>
                              <span className="text-xs text-muted-2">{p}%</span>
                            </div>
                            <Progress value={p} className="mt-2.5" height={6} color={g.color} />
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <HabitDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
