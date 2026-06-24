"use client";

import { formatDate } from "@/lib/utils";

export function Heatmap({
  cells,
  color = "#4f8cff",
  columns = 7,
}: {
  cells: { key: string; ratio: number; scheduled: boolean }[];
  color?: string;
  columns?: number;
}) {
  const shade = (c: { ratio: number; scheduled: boolean }) => {
    if (!c.scheduled) return "var(--surface-2)";
    if (c.ratio <= 0) return "var(--border)";
    const op = 0.25 + c.ratio * 0.75;
    return `${color}${Math.round(op * 255)
      .toString(16)
      .padStart(2, "0")}`;
  };

  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {cells.map((c) => (
        <div
          key={c.key}
          title={`${formatDate(c.key)} · ${Math.round(c.ratio * 100)}%`}
          className="aspect-square rounded-[4px] transition-transform hover:scale-110"
          style={{ background: shade(c) }}
        />
      ))}
    </div>
  );
}
