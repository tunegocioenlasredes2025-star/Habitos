"use client";

import { useState } from "react";

export interface BarPoint {
  label: string;
  value: number; // 0..100
  key?: string;
}

export function BarChart({
  data,
  color = "var(--primary)",
  height = 160,
  highlightLast = true,
}: {
  data: BarPoint[];
  color?: string;
  height?: number;
  highlightLast?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  if (!data.length) return null;

  return (
    <div className="flex w-full items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const active = hover === i || (hover === null && highlightLast && isLast);
        return (
          <div
            key={d.key ?? i}
            className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            {(hover === i) && (
              <div className="absolute -top-1 z-10 rounded-md border border-border-strong bg-surface px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow-lg">
                {d.value}%
              </div>
            )}
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-md transition-all duration-300"
                style={{
                  height: `${Math.max(2, d.value)}%`,
                  background: color,
                  opacity: active ? 1 : 0.55,
                }}
              />
            </div>
            <span className="text-[10px] text-muted-2">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
