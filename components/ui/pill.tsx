import type { ReactNode } from "react";
import type { Hue } from "@/lib/theme/hues";
import { cn } from "@/lib/ui/cn";
import { hueSoftVar, hueVar, tintStyle } from "@/lib/ui/hue";

export type PillTone = "neutral" | "accent" | "positive" | "negative" | "warning" | "info";

const TONE_COLOR: Record<PillTone, string> = {
  neutral: "var(--color-ink-muted)",
  accent: "var(--color-accent)",
  positive: "var(--color-positive)",
  negative: "var(--color-negative)",
  warning: "var(--color-warning)",
  info: "var(--color-info)",
};

/** Text stays in ink. Colour appears as a tint and a dot, so meaning never rests on colour alone. */
export function Pill({
  tone = "neutral",
  hue,
  className,
  children,
}: {
  tone?: PillTone;
  hue?: Hue;
  className?: string;
  children: ReactNode;
}) {
  const color = hue ? hueVar(hue) : TONE_COLOR[tone];

  return (
    <span
      className={cn(
        "text-ink inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        className,
      )}
      style={hue ? { background: hueSoftVar(hue) } : tintStyle(color, 14)}
    >
      <span aria-hidden className="size-1.5 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}
