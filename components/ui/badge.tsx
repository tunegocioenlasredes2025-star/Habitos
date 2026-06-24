import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  color,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { color?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      style={
        color
          ? { color, borderColor: `${color}40`, background: `${color}1a` }
          : undefined
      }
      {...props}
    >
      {children}
    </span>
  );
}

export function Dot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: color }}
    />
  );
}
