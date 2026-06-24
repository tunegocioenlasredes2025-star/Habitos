"use client";

import { Check } from "lucide-react";
import { PALETTE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETTE.map((c) => (
        <button
          key={c.value}
          type="button"
          title={c.name}
          onClick={() => onChange(c.value)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110",
            value === c.value && "ring-2 ring-offset-2 ring-offset-surface",
          )}
          style={{
            background: c.value,
            // ring color via boxShadow trick
            boxShadow: value === c.value ? `0 0 0 2px var(--surface), 0 0 0 4px ${c.value}` : undefined,
          }}
        >
          {value === c.value && <Check size={15} className="text-white" />}
        </button>
      ))}
    </div>
  );
}
