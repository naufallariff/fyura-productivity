import { cn } from "@/lib/ui/cn";
import { sparklinePath } from "@/lib/ui/sparkline";

export type SparklineTone = "accent" | "positive" | "negative" | "neutral";

const TONE_COLOR: Record<SparklineTone, string> = {
  accent: "var(--accent)",
  positive: "var(--positive)",
  negative: "var(--negative)",
  neutral: "var(--ink-muted)",
};

const WIDTH = 120;
const HEIGHT = 36;

export function Sparkline({
  values,
  label,
  tone = "accent",
  dashed = false,
  className,
}: {
  values: readonly number[];
  label?: string;
  tone?: SparklineTone;
  /** Use for an unfinished period. */
  dashed?: boolean;
  className?: string;
}) {
  const path = sparklinePath(values, WIDTH, HEIGHT);
  if (!path) return null;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("h-9", className ?? "w-full")}
    >
      <path
        d={path}
        fill="none"
        stroke={TONE_COLOR[tone]}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashed ? "4 4" : undefined}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
