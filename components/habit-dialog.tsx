"use client";

import { useEffect, useState } from "react";
import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { Field } from "./ui/label";
import { Segmented } from "./ui/segmented";
import { ColorPicker } from "./ui/color-picker";
import { useData } from "./data-provider";
import { useToast } from "./toast-provider";
import { HABIT_CATEGORIES } from "@/lib/constants";
import { SHORT_WEEKDAYS } from "@/lib/utils";
import type { Frequency, Habit, HabitType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_OPTS: { value: HabitType; label: string }[] = [
  { value: "boolean", label: "Sí / No" },
  { value: "quantity", label: "Cantidad" },
  { value: "time", label: "Tiempo" },
];

const FREQ_OPTS: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Todos los días" },
  { value: "weekdays", label: "Días de semana (L-V)" },
  { value: "weekly", label: "Meta semanal" },
  { value: "custom", label: "Días específicos" },
];

export function HabitDialog({
  open,
  onClose,
  habit,
}: {
  open: boolean;
  onClose: () => void;
  habit?: Habit | null;
}) {
  const { saveHabit } = useData();
  const toast = useToast();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Salud");
  const [type, setType] = useState<HabitType>("boolean");
  const [target, setTarget] = useState(1);
  const [unit, setUnit] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [weekly, setWeekly] = useState(3);
  const [color, setColor] = useState("#4f8cff");

  useEffect(() => {
    if (!open) return;
    if (habit) {
      setName(habit.name);
      setCategory(habit.category);
      setType(habit.type);
      setTarget(habit.target_daily || 1);
      setUnit(habit.unit);
      setFrequency(habit.frequency);
      setDays(habit.days?.length ? habit.days : [0, 1, 2, 3, 4, 5, 6]);
      setWeekly(habit.target_weekly || 3);
      setColor(habit.color);
    } else {
      setName("");
      setCategory("Salud");
      setType("boolean");
      setTarget(1);
      setUnit("");
      setFrequency("daily");
      setDays([0, 1, 2, 3, 4, 5, 6]);
      setWeekly(3);
      setColor("#4f8cff");
    }
  }, [open, habit]);

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));

  const save = () => {
    if (!name.trim()) {
      toast("Poné un nombre al hábito.", "warning");
      return;
    }
    saveHabit({
      id: habit?.id,
      name: name.trim(),
      category,
      type,
      target_daily: type === "boolean" ? 1 : Math.max(1, target),
      unit: type === "boolean" ? "" : unit.trim() || (type === "time" ? "min" : "u"),
      frequency,
      days: frequency === "custom" ? days : [0, 1, 2, 3, 4, 5, 6],
      target_weekly: frequency === "weekly" ? Math.max(1, weekly) : null,
      color,
    });
    toast(habit ? "Hábito actualizado." : "Hábito creado.");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={habit ? "Editar hábito" : "Nuevo hábito"}
      description="Definí qué querés sostener y cómo medirlo."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>{habit ? "Guardar" : "Crear hábito"}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Nombre">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Leer 30 minutos"
            autoFocus
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Categoría">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {HABIT_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted">Tipo de medición</span>
            <Segmented options={TYPE_OPTS} value={type} onChange={setType} className="w-full [&>button]:flex-1" />
          </div>
        </div>

        {type !== "boolean" && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Objetivo diario">
              <Input
                type="number"
                min={1}
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
              />
            </Field>
            <Field label="Unidad">
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder={type === "time" ? "min" : "vasos, pág…"}
              />
            </Field>
          </div>
        )}

        <Field label="Frecuencia">
          <Select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
            {FREQ_OPTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
        </Field>

        {frequency === "custom" && (
          <div className="flex gap-1.5">
            {SHORT_WEEKDAYS.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={cn(
                  "h-9 flex-1 rounded-lg border text-sm font-medium transition",
                  days.includes(i)
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-surface-2 text-muted-2 hover:text-foreground",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        {frequency === "weekly" && (
          <Field label="Veces por semana" hint="Cuántos días por semana querés cumplirlo.">
            <Input
              type="number"
              min={1}
              max={7}
              value={weekly}
              onChange={(e) => setWeekly(Number(e.target.value))}
            />
          </Field>
        )}

        <div>
          <span className="mb-2 block text-xs font-medium text-muted">Color</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>
      </div>
    </Dialog>
  );
}
