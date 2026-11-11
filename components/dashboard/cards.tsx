import { t } from "@/lib/i18n";
import { formatPercent, formatPoints } from "@/lib/i18n/format";
import type { TrendPoint } from "@/lib/scoring/ewma";

export function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={`elevated rounded-card border-line bg-surface/85 border p-5 backdrop-blur-xl sm:p-6 ${className}`}
    >
      <h2 className="text-muted mb-4 text-xs font-medium tracking-widest uppercase">{title}</h2>
      {children}
    </section>
  );
}

export function TrendSparkline({ points, label }: { points: TrendPoint[]; label: string }) {
  if (points.length < 2) return null;

  const W = 600;
  const H = 160;
  const P = 8;
  const x = (i: number) => P + (i / (points.length - 1)) * (W - 2 * P);
  const y = (v: number) => P + (1 - v) * (H - 2 * P);

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.ewma).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)} ${H - P} L${x(0).toFixed(1)} ${H - P} Z`;

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-40 w-full"
    >
      <defs>
        <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--accent)" }} stopOpacity="0.35" />
          <stop offset="100%" style={{ stopColor: "var(--accent)" }} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#trend-fill)" />
      <path
        d={line}
        fill="none"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        style={{ stroke: "var(--accent)" }}
      />
    </svg>
  );
}

export function Delta({ value }: { value: number | null }) {
  if (value === null)
    return <span className="text-muted text-sm">{t("dashboard.delta.none")}</span>;
  const positive = value >= 0;
  return (
    <span
      className={`text-2xl font-semibold tracking-[-0.02em] tabular-nums ${positive ? "text-accent" : "text-danger"}`}
    >
      {positive ? "+" : ""}
      {formatPoints(value * 100)} {t("dashboard.points")}
    </span>
  );
}

export { formatPercent };
