"use client";

import { Check, Minus, Plus, Flame, MoreVertical } from "lucide-react";
import type { Habit } from "@/lib/types";
import { useData } from "./data-provider";
import {
  dayCompletionRatio,
  habitStreak,
  isDayComplete,
  isScheduled,
  valueFor,
} from "@/lib/stats";
import { todayKey, cn } from "@/lib/utils";

export function HabitItem({
  habit,
  dateKey = todayKey(),
  onMenu,
}: {
  habit: Habit;
  dateKey?: string;
  onMenu?: () => void;
}) {
  const { logs, setLog, toggleHabit } = useData();
  const value = valueFor(logs, habit.id, dateKey);
  const done = isDayComplete(habit, value);
  const ratio = dayCompletionRatio(habit, value);
  const streak = habitStreak(habit, logs).current;
  const scheduled = isScheduled(habit, dateKey);

  const step = habit.type === "time" ? 15 : 1;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-3 transition-colors",
        done && "border-success/30 bg-success/[0.06]",
        !scheduled && "opacity-55",
      )}
    >
      {/* Color rail */}
      <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: habit.color }} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{habit.name}</p>
          {streak > 0 && (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-warning">
              <Flame size={12} />
              {streak}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-2">
          {habit.category}
          {habit.type !== "boolean" && (
            <>
              {" · "}
              <span className={cn(done && "text-success")}>
                {value}/{habit.target_daily} {habit.unit}
              </span>
            </>
          )}
          {!scheduled && " · hoy no toca"}
        </p>
      </div>

      {/* Controls */}
      {habit.type === "boolean" ? (
        <button
          onClick={() => toggleHabit(habit, dateKey)}
          aria-label={done ? "Marcar como no hecho" : "Marcar como hecho"}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all active:scale-90",
            done
              ? "border-success bg-success text-white"
              : "border-border-strong text-muted-2 hover:border-success hover:text-success",
          )}
        >
          <Check size={18} />
        </button>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setLog(habit, dateKey, Math.max(0, value - step))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-2 transition hover:text-foreground active:scale-90"
            aria-label="Restar"
          >
            <Minus size={15} />
          </button>
          <div
            className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border"
            style={{ borderColor: done ? "var(--success)" : "var(--border-strong)" }}
          >
            <span
              className="absolute inset-x-0 bottom-0 transition-[height] duration-300"
              style={{ height: `${ratio * 100}%`, background: `${habit.color}33` }}
            />
            <span className="relative text-xs font-semibold text-foreground">{value}</span>
          </div>
          <button
            onClick={() => setLog(habit, dateKey, value + step)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-2 transition hover:text-foreground active:scale-90"
            aria-label="Sumar"
          >
            <Plus size={15} />
          </button>
        </div>
      )}

      {onMenu && (
        <button
          onClick={onMenu}
          className="flex h-9 w-8 shrink-0 items-center justify-center rounded-lg text-muted-2 transition hover:bg-surface-2 hover:text-foreground"
          aria-label="Opciones"
        >
          <MoreVertical size={18} />
        </button>
      )}
    </div>
  );
}
