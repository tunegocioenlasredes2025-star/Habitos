"use client";

import { useEffect, useState } from "react";
import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select } from "./ui/select";
import { Field } from "./ui/label";
import { ColorPicker } from "./ui/color-picker";
import { useData } from "./data-provider";
import { useToast } from "./toast-provider";
import { GOAL_CATEGORIES } from "@/lib/constants";
import { addDays, toDateKey, todayKey } from "@/lib/utils";
import type { Goal } from "@/lib/types";

export function GoalDialog({
  open,
  onClose,
  goal,
}: {
  open: boolean;
  onClose: () => void;
  goal?: Goal | null;
}) {
  const { saveGoal } = useData();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Personal");
  const [target, setTarget] = useState(10);
  const [current, setCurrent] = useState(0);
  const [unit, setUnit] = useState("");
  const [start, setStart] = useState(todayKey());
  const [due, setDue] = useState(toDateKey(addDays(new Date(), 30)));
  const [color, setColor] = useState("#6e7ff2");

  useEffect(() => {
    if (!open) return;
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description);
      setCategory(goal.category);
      setTarget(goal.target_value);
      setCurrent(goal.current_value);
      setUnit(goal.unit);
      setStart(goal.start_date);
      setDue(goal.due_date);
      setColor(goal.color);
    } else {
      setTitle("");
      setDescription("");
      setCategory("Personal");
      setTarget(10);
      setCurrent(0);
      setUnit("");
      setStart(todayKey());
      setDue(toDateKey(addDays(new Date(), 30)));
      setColor("#6e7ff2");
    }
  }, [open, goal]);

  const save = () => {
    if (!title.trim()) {
      toast("Poné un título al objetivo.", "warning");
      return;
    }
    saveGoal({
      id: goal?.id,
      title: title.trim(),
      description: description.trim(),
      category,
      target_value: Math.max(1, target),
      current_value: Math.max(0, current),
      unit: unit.trim(),
      start_date: start,
      due_date: due,
      color,
    });
    toast(goal ? "Objetivo actualizado." : "Objetivo creado.");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={goal ? "Editar objetivo" : "Nuevo objetivo"}
      description="Definí una meta medible con fecha límite."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>{goal ? "Guardar" : "Crear objetivo"}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Título">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Leer 10 libros"
            autoFocus
          />
        </Field>
        <Field label="Descripción (opcional)">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="¿Por qué importa este objetivo?"
            rows={2}
          />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Meta">
            <Input type="number" min={1} value={target} onChange={(e) => setTarget(Number(e.target.value))} />
          </Field>
          <Field label="Actual">
            <Input type="number" min={0} value={current} onChange={(e) => setCurrent(Number(e.target.value))} />
          </Field>
          <Field label="Unidad">
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="libros, kg…" />
          </Field>
        </div>

        <Field label="Categoría">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {GOAL_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Inicio">
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="Fecha límite">
            <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
        </div>

        <div>
          <span className="mb-2 block text-xs font-medium text-muted">Color</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>
      </div>
    </Dialog>
  );
}
