"use client";

import { useMemo, useState, useEffect } from "react";
import { Plus, NotebookPen, Search, Trash2 } from "lucide-react";
import { useData } from "@/components/data-provider";
import { useToast } from "@/components/toast-provider";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import type { JournalEntry } from "@/lib/types";
import { formatDate, todayKey } from "@/lib/utils";

const MOODS = [
  { value: 1, label: "Difícil", color: "#ef4444" },
  { value: 2, label: "Flojo", color: "#f59e0b" },
  { value: 3, label: "Normal", color: "#94a3b8" },
  { value: 4, label: "Bueno", color: "#38bdf8" },
  { value: 5, label: "Excelente", color: "#22c55e" },
];

function NoteDialog({
  open,
  onClose,
  entry,
}: {
  open: boolean;
  onClose: () => void;
  entry: JournalEntry | null;
}) {
  const { saveEntry, deleteEntry } = useData();
  const toast = useToast();
  const [date, setDate] = useState(todayKey());
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    if (entry) {
      setDate(entry.date);
      setTitle(entry.title);
      setContent(entry.content);
      setMood(entry.mood);
    } else {
      setDate(todayKey());
      setTitle("");
      setContent("");
      setMood(null);
    }
  }, [open, entry]);

  const save = () => {
    if (!content.trim() && !title.trim()) {
      toast("Escribí algo antes de guardar.", "warning");
      return;
    }
    saveEntry({ id: entry?.id, date, title: title.trim(), content: content.trim(), mood });
    toast(entry ? "Nota actualizada." : "Nota guardada.");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={entry ? "Editar nota" : "Nueva nota"}
      size="lg"
      footer={
        <>
          {entry && (
            <Button
              variant="danger"
              className="mr-auto"
              onClick={() => {
                deleteEntry(entry.id);
                toast("Nota eliminada.", "info");
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
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Título (opcional)">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Encabezado" />
          </Field>
        </div>
        <Field label="Entrada">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder="¿Cómo estuvo tu día? ¿Qué aprendiste?"
            autoFocus
          />
        </Field>
        <div>
          <span className="mb-2 block text-xs font-medium text-muted">¿Cómo te sentiste?</span>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(mood === m.value ? null : m.value)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                  mood === m.value ? "text-white" : "border-border bg-surface-2 text-muted hover:text-foreground",
                )}
                style={mood === m.value ? { background: m.color, borderColor: m.color } : undefined}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

export default function NotesPage() {
  const { journal } = useData();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return journal
      .filter(
        (e) =>
          !q ||
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.date.includes(q),
      )
      .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
  }, [journal, query]);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Notas"
        subtitle="Tu diario personal, organizado por fecha."
        action={
          <Button onClick={openNew}>
            <Plus size={17} /> Nueva
          </Button>
        }
      />

      {journal.length > 0 && (
        <div className="relative mb-5">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en tus notas…"
            className="pl-9"
          />
        </div>
      )}

      {journal.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="Tu diario está vacío"
          description="Registrá tus reflexiones, aprendizajes y cómo te sentiste cada día."
          action={
            <Button onClick={openNew}>
              <Plus size={17} /> Escribir primera nota
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted">No se encontraron notas para “{query}”.</Card>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 [&>*]:mb-4">
          {filtered.map((e) => {
            const mood = MOODS.find((m) => m.value === e.mood);
            return (
              <Card
                key={e.id}
                hover
                className="block w-full break-inside-avoid p-4 text-left"
                role="button"
                onClick={() => {
                  setEditing(e);
                  setOpen(true);
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-2">
                    {formatDate(e.date, { weekday: true })}
                  </span>
                  {mood && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: `${mood.color}22`, color: mood.color }}
                    >
                      {mood.label}
                    </span>
                  )}
                </div>
                {e.title && <h3 className="mt-2 text-sm font-semibold text-foreground">{e.title}</h3>}
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted line-clamp-6">
                  {e.content}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      <NoteDialog open={open} onClose={() => setOpen(false)} entry={editing} />
    </div>
  );
}
