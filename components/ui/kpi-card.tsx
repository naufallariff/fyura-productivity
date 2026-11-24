import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { Hue } from "@/lib/theme/hues";
import type { Meaning, Trend } from "@/lib/ui/delta";
import { cn } from "@/lib/ui/cn";
import { Sparkline } from "./sparkline";

export interface KpiDelta {
  /** Already formatted by the caller, for example "+12.5%". */
  readonly text: string;
  readonly trend: Trend;
  readonly meaning: Meaning;
}

export interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hue: Hue;
  delta?: KpiDelta | null;
  /** Short baseline text, for example "vs last week". */
  baseline?: string;
  sparkline?: readonly number[];
  sparklineLabel?: string;
  className?: string;
}

const TREND_ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus } as const;

const MEANING_TEXT = {
  positive: "text-positive",
  negative: "text-negative",
  neutral: "text-ink-muted",
} as const;

export function KpiCard({
  label,
  value,
  icon: Icon,
  hue,
  delta,
  baseline,
  sparkline,
  sparklineLabel,
  className,
}: KpiCardProps) {
  const TrendIcon = delta ? TREND_ICON[delta.trend] : null;

  return (
    <section
      aria-label={label}
      data-hue={hue}
      className={cn(
        "kpi-card flex flex-col gap-4 rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-4 shadow-(--shadow-card)",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-ink-muted text-sm font-medium">{label}</p>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-(--kpi-icon-bg)">
          <Icon aria-hidden strokeWidth={1.75} className="size-4.5 text-(color:--kpi-icon-fg)" />
        </span>
      </div>

      <p className="text-ink text-3xl leading-none font-semibold tracking-[-0.02em] tabular-nums">
        {value}
      </p>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 space-y-1">
          {delta && TrendIcon && (
            <p
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
                MEANING_TEXT[delta.meaning],
              )}
            >
              <TrendIcon aria-hidden className="size-3.5" />
              {delta.text}
            </p>
          )}
          {baseline && <p className="text-ink-muted truncate text-xs">{baseline}</p>}
        </div>
        {sparkline && (
          <Sparkline values={sparkline} label={sparklineLabel} className="w-24 shrink-0" />
        )}
      </div>
    </section>
  );
}
