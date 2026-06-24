import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  color = "var(--primary)",
  height = 8,
}: {
  value: number;
  className?: string;
  color?: string;
  height?: number;
}) {
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-surface-2", className)}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: color,
        }}
      />
    </div>
  );
}
