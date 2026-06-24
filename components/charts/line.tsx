"use client";

export interface LinePoint {
  label: string;
  value: number; // 0..100
}

export function LineChart({
  data,
  color = "var(--primary)",
  height = 180,
}: {
  data: LinePoint[];
  color?: string;
  height?: number;
}) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-2" style={{ height }}>
        Necesitás más datos para ver la evolución.
      </div>
    );
  }

  const W = 100;
  const H = 100;
  const pad = 4;
  const step = (W - pad * 2) / (data.length - 1);
  const y = (v: number) => H - pad - (v / 100) * (H - pad * 2);
  const points = data.map((d, i) => [pad + i * step, y(d.value)] as const);

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${path} L${points[points.length - 1][0]},${H - pad} L${points[0][0]},${H - pad} Z`;

  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id="lc-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((g) => (
          <line
            key={g}
            x1={pad}
            x2={W - pad}
            y1={y(g)}
            y2={y(g)}
            stroke="var(--border)"
            strokeWidth="0.3"
          />
        ))}
        <path d={area} fill="url(#lc-grad)" />
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="1.4" fill={color} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-muted-2">
        {data.map((d, i) => (
          <span key={i}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}
