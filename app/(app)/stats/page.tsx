"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3, Flame, Trophy } from "lucide-react";
import { useData } from "@/components/data-provider";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty";
import { Ring } from "@/components/charts/ring";
import { BarChart } from "@/components/charts/bars";
import { LineChart } from "@/components/charts/line";
import {
  completionSeries,
  monthlySeries,
  periodAverage,
  habitCompletionInWindow,
  habitStreak,
} from "@/lib/stats";

type Period = "week" | "month" | "year";
const DAYS: Record<Exclude<Period, "year">, number> = { week: 7, month: 30 };

export default function StatsPage() {
  const { habits, logs } = useData();
  const [period, setPeriod] = useState<Period>("week");

  const active = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  const series = useMemo(() => {
    if (period === "year") return monthlySeries(active, logs, 12);
    return completionSeries(active, logs, DAYS[period]);
  }, [active, logs, period]);

  const { current, previous } = useMemo(() => {
    if (period === "year") {
      return {
        current: periodAverage(active, logs, 365),
        previous: periodAverage(active, logs, 365, 365),
      };
    }
    const d = DAYS[period];
    return {
      current: periodAverage(active, logs, d),
      previous: periodAverage(active, logs, d, d),
    };
  }, [active, logs, period]);

  const delta = current - previous;
  const windowDays = period === "week" ? 7 : period === "month" ? 30 : 365;

  const leaderboard = useMemo(
    () =>
      active
        .map((h) => ({
          habit: h,
          completion: habitCompletionInWindow(h, logs, windowDays),
          streak: habitStreak(h, logs),
        }))
        .sort((a, b) => b.completion - a.completion),
    [active, logs, windowDays],
  );

  const bestStreak = leaderboard.reduce((m, x) => Math.max(m, x.streak.best), 0);

  if (active.length === 0) {
    return (
      <div>
        <PageHeader title="Estadísticas" subtitle="Tu progreso a lo largo del tiempo." />
        <EmptyState
          icon={BarChart3}
          title="Sin datos todavía"
          description="Creá hábitos y registrá tu progreso para ver tus estadísticas acá."
        />
      </div>
    );
  }

  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor = delta > 0 ? "var(--success)" : delta < 0 ? "var(--danger)" : "var(--muted)";

  return (
    <div>
      <PageHeader title="Estadísticas" subtitle="Tu constancia, evolución y productividad." />

      <Segmented
        className="mb-5"
        value={period}
        onChange={setPeriod}
        options={[
          { value: "week", label: "Semana" },
          { value: "month", label: "Mes" },
          { value: "year", label: "Año" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex items-center gap-5 p-5">
          <Ring value={current} label={`${current}%`} sublabel="cumplim." size={120} stroke={11} />
          <div>
            <p className="text-sm text-muted">Cumplimiento promedio</p>
            <div className="mt-1 flex items-center gap-1.5" style={{ color: deltaColor }}>
              <DeltaIcon size={16} />
              <span className="text-sm font-medium">
                {delta > 0 ? "+" : ""}
                {delta}% vs período anterior
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted">
            <Flame size={15} className="text-warning" />
            <span className="text-xs font-medium">Mejor racha histórica</span>
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{bestStreak}</p>
          <p className="text-xs text-muted-2">días consecutivos</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted">
            <Trophy size={15} className="text-secondary" />
            <span className="text-xs font-medium">Período anterior</span>
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{previous}%</p>
          <p className="text-xs text-muted-2">para comparar</p>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          {period === "year" ? "Evolución mensual" : "Evolución del cumplimiento"}
        </h2>
        {period === "week" ? (
          <BarChart data={series} />
        ) : (
          <LineChart data={series} />
        )}
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Rendimiento por hábito</h2>
        <div className="space-y-3.5">
          {leaderboard.map(({ habit, completion, streak }) => (
            <div key={habit.id}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: habit.color }} />
                  <span className="truncate text-sm text-foreground">{habit.name}</span>
                  {streak.current > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] text-warning">
                      <Flame size={11} />
                      {streak.current}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-sm font-medium text-muted">{completion}%</span>
              </div>
              <Progress value={completion} color={habit.color} height={6} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
