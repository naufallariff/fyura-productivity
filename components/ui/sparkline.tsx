"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/ui/cn";
import { sparklinePath } from "@/lib/ui/sparkline";

export type SparklineTone = "accent" | "positive" | "negative" | "neutral" | "current";

const TONE_COLOR: Record<SparklineTone, string> = {
  accent: "var(--color-accent)",
  positive: "var(--color-positive)",
  negative: "var(--color-negative)",
  neutral: "var(--color-ink-muted)",
  current: "currentColor",
};

const WIDTH = 120;
const HEIGHT = 36;
const PADDING = 2;

export function Sparkline({
  values,
  label,
  tone = "accent",
  dashed = false,
  className,
  range,
  formatValue = String,
}: {
  readonly values: readonly number[];
  readonly label?: string;
  readonly tone?: SparklineTone;
  readonly dashed?: boolean;
  readonly className?: string;
  readonly range?: readonly [min: number, max: number];
  readonly formatValue?: (value: number, index: number) => string;
}) {
  const id = useId();
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const points = values.flatMap((value, index) =>
    Number.isFinite(value) ? [{ value, index }] : [],
  );
  const path = sparklinePath(
    points.map(({ value }) => value),
    WIDTH,
    HEIGHT,
    PADDING,
    range,
  );
  if (!path) return null;

  const color = TONE_COLOR[tone];
  const last = points.length - 1;
  const step = (WIDTH - PADDING * 2) / last;
  const clampIndex = (index: number) => Math.max(0, Math.min(last, index));
  const active = hovered ?? focused;
  const point = active === null ? undefined : points[active];

  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-describedby={point && label ? id : undefined}
      tabIndex={label ? 0 : undefined}
      className={cn("relative rounded-sm", className ?? "w-full")}
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width) * WIDTH;
        setHovered(clampIndex(Math.round((x - PADDING) / step)));
      }}
      onPointerLeave={() => setHovered(null)}
      onFocus={() => setFocused(last)}
      onBlur={() => setFocused(null)}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const direction = event.key === "ArrowLeft" ? -1 : 1;
        setHovered(null);
        setFocused((current) => clampIndex((current ?? last) + direction));
      }}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden
        className="block h-12 w-full"
      >
        <defs>
          <linearGradient id={`${id}-fill`} x2="0%" y2="100%">
            <stop offset="0" stopColor={color} stopOpacity={0.2} />
            <stop offset="1" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path
          d={`${path} L${WIDTH - PADDING} ${HEIGHT} L${PADDING} ${HEIGHT} Z`}
          fill={`url(#${id}-fill)`}
        />
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={dashed ? "4 4" : undefined}
          vectorEffect="non-scaling-stroke"
        />
        {point && active !== null && (
          <path
            d={`M${PADDING + active * step} 0 V${HEIGHT}`}
            stroke={color}
            strokeOpacity={0.35}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {point && (
        <span
          id={id}
          role="tooltip"
          className="text-ink pointer-events-none absolute end-0 bottom-full z-10 mb-1 rounded-lg border border-(--border-subtle) bg-(--bg-surface-elevated) px-2 py-1 text-xs tabular-nums shadow-(--shadow-card)"
        >
          {formatValue(point.value, point.index)}
        </span>
      )}
    </div>
  );
}
