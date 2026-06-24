"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, CircleCheck } from "lucide-react";
import { useData } from "@/components/data-provider";
import { EventDialog } from "@/components/event-dialog";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import type { CalendarEvent } from "@/lib/types";
import { dayScore, isScheduled } from "@/lib/stats";
import {
  addDays,
  startOfWeek,
  startOfMonth,
  toDateKey,
  todayKey,
  monthLabel,
  formatDate,
  minutesToTime,
  clamp,
  cn,
  SHORT_WEEKDAYS,
} from "@/lib/utils";

type View = "day" | "week" | "month";
const PX = 0.78; // pixels per minute
const SNAP = 15;

// -------------------- Event block (click + drag) --------------------
function EventBlock({
  ev,
  onEdit,
  onMove,
}: {
  ev: CalendarEvent;
  onEdit: () => void;
  onMove: (startMin: number) => void;
}) {
  const drag = useRef<{ startY: number; orig: number; moved: boolean } | null>(null);
  const [preview, setPreview] = useState<number | null>(null);

  const start = preview ?? ev.start_min;
  const dur = ev.end_min - ev.start_min;

  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, orig: ev.start_min, moved: false };
  };
  const onMovePtr = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const deltaMin = (e.clientY - drag.current.startY) / PX;
    if (Math.abs(e.clientY - drag.current.startY) > 4) drag.current.moved = true;
    let next = drag.current.orig + deltaMin;
    next = clamp(Math.round(next / SNAP) * SNAP, 0, 1440 - dur);
    setPreview(next);
  };
  const onUp = () => {
    if (!drag.current) return;
    const { moved } = drag.current;
    const next = preview;
    drag.current = null;
    setPreview(null);
    if (moved && next != null && next !== ev.start_min) onMove(next);
    else if (!moved) onEdit();
  };

  return (
    <div
      onPointerDown={onDown}
      onPointerMove={onMovePtr}
      onPointerUp={onUp}
      className="absolute left-0.5 right-0.5 cursor-grab touch-none overflow-hidden rounded-md border px-2 py-1 text-left active:cursor-grabbing"
      style={{
        top: start * PX,
        height: Math.max(18, dur * PX - 2),
        background: `${ev.color}22`,
        borderColor: `${ev.color}55`,
        borderLeft: `3px solid ${ev.color}`,
        zIndex: preview != null ? 20 : 1,
      }}
    >
      <p className="truncate text-[11px] font-medium leading-tight text-foreground">{ev.title}</p>
      {dur * PX > 30 && (
        <p className="text-[10px] text-muted-2">
          {minutesToTime(start)}–{minutesToTime(start + dur)}
        </p>
      )}
    </div>
  );
}

function TimeColumn({
  date,
  events,
  onCreate,
  onEdit,
  onMove,
}: {
  date: string;
  events: CalendarEvent[];
  onCreate: (startMin: number) => void;
  onEdit: (ev: CalendarEvent) => void;
  onMove: (ev: CalendarEvent, startMin: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const click = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    const rect = ref.current!.getBoundingClientRect();
    const min = clamp(Math.round((e.clientY - rect.top) / PX / 60) * 60, 0, 23 * 60);
    onCreate(min);
  };
  return (
    <div
      ref={ref}
      onClick={click}
      className="relative flex-1 border-l border-border"
      style={{ height: 1440 * PX }}
    >
      {Array.from({ length: 24 }, (_, h) => (
        <div
          key={h}
          className="pointer-events-none absolute inset-x-0 border-t border-border/60"
          style={{ top: h * 60 * PX }}
        />
      ))}
      {events.map((ev) => (
        <EventBlock key={ev.id} ev={ev} onEdit={() => onEdit(ev)} onMove={(s) => onMove(ev, s)} />
      ))}
    </div>
  );
}

function HourGutter() {
  return (
    <div className="relative w-12 shrink-0" style={{ height: 1440 * PX }}>
      {Array.from({ length: 24 }, (_, h) => (
        <div
          key={h}
          className="absolute right-1.5 -translate-y-1/2 text-[10px] text-muted-2"
          style={{ top: h * 60 * PX }}
        >
          {h > 0 ? `${String(h).padStart(2, "0")}:00` : ""}
        </div>
      ))}
    </div>
  );
}

export default function CalendarPage() {
  const { events, habits, logs, saveEvent } = useData();
  const [view, setView] = useState<View>("week");
  const [cursor, setCursor] = useState(new Date());
  const [dialog, setDialog] = useState<{
    open: boolean;
    event: CalendarEvent | null;
    date: string;
    start?: number;
  }>({ open: false, event: null, date: todayKey() });

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return map;
  }, [events]);

  const move = (n: number) => {
    setCursor((c) => addDays(c, n * (view === "month" ? 30 : view === "week" ? 7 : 1)));
  };

  const openCreate = (date: string, start?: number) =>
    setDialog({ open: true, event: null, date, start });
  const openEdit = (event: CalendarEvent) =>
    setDialog({ open: true, event, date: event.date });
  const onMoveEvent = (ev: CalendarEvent, startMin: number) =>
    saveEvent({ ...ev, start_min: startMin, end_min: startMin + (ev.end_min - ev.start_min) });

  const title =
    view === "month"
      ? monthLabel(cursor)
      : view === "week"
        ? `Semana del ${formatDate(startOfWeek(cursor))}`
        : formatDate(cursor, { weekday: true, long: true });

  return (
    <div>
      <PageHeader
        title="Calendario"
        subtitle="Planificá tu tiempo. Tocá para crear, arrastrá para reprogramar."
        action={
          <Button onClick={() => openCreate(toDateKey(cursor), 9 * 60)}>
            <Plus size={17} /> Evento
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="icon-sm" onClick={() => move(-1)}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setCursor(new Date())}>
            Hoy
          </Button>
          <Button variant="secondary" size="icon-sm" onClick={() => move(1)}>
            <ChevronRight size={16} />
          </Button>
          <span className="ml-1 text-sm font-medium capitalize text-foreground">{title}</span>
        </div>
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: "day", label: "Día" },
            { value: "week", label: "Semana" },
            { value: "month", label: "Mes" },
          ]}
        />
      </div>

      {view === "month" && (
        <MonthView
          cursor={cursor}
          eventsByDate={eventsByDate}
          habits={habits}
          logs={logs}
          onDay={(d) => {
            setCursor(d);
            setView("day");
          }}
          onEvent={openEdit}
        />
      )}

      {view === "week" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <div className="min-w-[640px]">
            <div className="flex border-b border-border">
              <div className="w-12 shrink-0" />
              {Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i)).map((d, i) => {
                const isToday = toDateKey(d) === todayKey();
                return (
                  <div key={i} className="flex-1 border-l border-border px-2 py-2 text-center">
                    <p className="text-[10px] uppercase text-muted-2">{SHORT_WEEKDAYS[(d.getDay() + 6) % 7]}</p>
                    <p className={cn("text-sm font-semibold", isToday ? "text-primary" : "text-foreground")}>
                      {d.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="flex max-h-[60vh] overflow-y-auto">
              <HourGutter />
              {Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i)).map((d) => {
                const key = toDateKey(d);
                return (
                  <TimeColumn
                    key={key}
                    date={key}
                    events={eventsByDate.get(key) ?? []}
                    onCreate={(s) => openCreate(key, s)}
                    onEdit={openEdit}
                    onMove={onMoveEvent}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {view === "day" && (
        <div className="rounded-xl border border-border bg-surface">
          <DayHabitBar date={toDateKey(cursor)} habits={habits} logs={logs} />
          <div className="flex max-h-[64vh] overflow-y-auto">
            <HourGutter />
            <TimeColumn
              date={toDateKey(cursor)}
              events={eventsByDate.get(toDateKey(cursor)) ?? []}
              onCreate={(s) => openCreate(toDateKey(cursor), s)}
              onEdit={openEdit}
              onMove={onMoveEvent}
            />
          </div>
        </div>
      )}

      <EventDialog
        open={dialog.open}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        event={dialog.event}
        defaultDate={dialog.date}
        defaultStart={dialog.start}
      />
    </div>
  );
}

function DayHabitBar({
  date,
  habits,
  logs,
}: {
  date: string;
  habits: ReturnType<typeof useData>["habits"];
  logs: ReturnType<typeof useData>["logs"];
}) {
  const scheduled = habits.filter((h) => !h.archived && isScheduled(h, date));
  const score = dayScore(habits, logs, date);
  if (!scheduled.length) return null;
  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-xs text-muted">
      <CircleCheck size={14} className="text-success" />
      Hábitos: {score.done}/{score.total} completados este día
    </div>
  );
}

function MonthView({
  cursor,
  eventsByDate,
  habits,
  logs,
  onDay,
  onEvent,
}: {
  cursor: Date;
  eventsByDate: Map<string, CalendarEvent[]>;
  habits: ReturnType<typeof useData>["habits"];
  logs: ReturnType<typeof useData>["logs"];
  onDay: (d: Date) => void;
  onEvent: (ev: CalendarEvent) => void;
}) {
  const first = startOfMonth(cursor);
  const gridStart = startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="grid grid-cols-7 border-b border-border">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-medium text-muted-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const key = toDateKey(d);
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = key === todayKey();
          const dayEvents = eventsByDate.get(key) ?? [];
          const score = dayScore(habits, logs, key);
          return (
            <button
              key={i}
              onClick={() => onDay(d)}
              className={cn(
                "min-h-[5.5rem] border-b border-l border-border p-1.5 text-left transition hover:bg-surface-2",
                i % 7 === 0 && "border-l-0",
                !inMonth && "opacity-40",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday ? "bg-primary text-white" : "text-foreground",
                  )}
                >
                  {d.getDate()}
                </span>
                {score.total > 0 && (
                  <span className="text-[9px] text-muted-2">
                    {score.done}/{score.total}
                  </span>
                )}
              </div>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEvent(ev);
                    }}
                    className="truncate rounded px-1 py-0.5 text-[10px] text-foreground"
                    style={{ background: `${ev.color}22`, borderLeft: `2px solid ${ev.color}` }}
                  >
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[9px] text-muted-2">+{dayEvents.length - 3} más</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
