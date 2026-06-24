"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Field } from "./ui/label";
import { ColorPicker } from "./ui/color-picker";
import { useData } from "./data-provider";
import { useToast } from "./toast-provider";
import type { CalendarEvent } from "@/lib/types";
import { minutesToTime, timeToMinutes } from "@/lib/utils";

export function EventDialog({
  open,
  onClose,
  event,
  defaultDate,
  defaultStart,
}: {
  open: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  defaultDate: string;
  defaultStart?: number;
}) {
  const { saveEvent, deleteEvent } = useData();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [color, setColor] = useState("#4f8cff");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (event) {
      setTitle(event.title);
      setDate(event.date);
      setStart(minutesToTime(event.start_min));
      setEnd(minutesToTime(event.end_min));
      setColor(event.color);
      setNotes(event.notes);
    } else {
      setTitle("");
      setDate(defaultDate);
      const s = defaultStart ?? 9 * 60;
      setStart(minutesToTime(s));
      setEnd(minutesToTime(s + 60));
      setColor("#4f8cff");
      setNotes("");
    }
  }, [open, event, defaultDate, defaultStart]);

  const save = () => {
    if (!title.trim()) {
      toast("Poné un título al evento.", "warning");
      return;
    }
    let s = timeToMinutes(start);
    let e = timeToMinutes(end);
    if (e <= s) e = s + 30;
    saveEvent({
      id: event?.id,
      title: title.trim(),
      date,
      start_min: s,
      end_min: e,
      color,
      category: event?.category ?? "Personal",
      notes: notes.trim(),
    });
    toast(event ? "Evento actualizado." : "Evento creado.");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={event ? "Editar evento" : "Nuevo evento"}
      footer={
        <>
          {event && (
            <Button
              variant="danger"
              className="mr-auto"
              onClick={() => {
                deleteEvent(event.id);
                toast("Evento eliminado.", "info");
                onClose();
              }}
            >
              <Trash2 size={15} /> Eliminar
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>Guardar</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Título">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Reunión" autoFocus />
        </Field>
        <Field label="Fecha">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Desde">
            <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="Hasta">
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
        <Field label="Notas (opcional)">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Detalles…" />
        </Field>
        <div>
          <span className="mb-2 block text-xs font-medium text-muted">Color</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>
      </div>
    </Dialog>
  );
}
