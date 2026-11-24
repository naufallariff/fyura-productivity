import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { Trend } from "@/lib/ui/delta";

const HUE_CLASSES = {
  consistency: "bg-(--kpi-consistency-bg) text-(color:--kpi-consistency-fg)",
  trend: "bg-(--kpi-trend-bg) text-(color:--kpi-trend-fg)",
  focus: "bg-(--kpi-focus-bg) text-(color:--kpi-focus-fg)",
  streak: "bg-(--kpi-streak-bg) text-(color:--kpi-streak-fg)",
} as const;

const TREND_ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus } as const;

export const KPI_EMPTY_VALUE = "–";

export interface KpiCardProps {
  readonly title: string;
  readonly value: ReactNode;
  readonly subtitle: string;
  readonly delta?: { readonly text: string; readonly trend: Trend } | null;
  readonly hue: keyof typeof HUE_CLASSES;
  readonly children?: ReactNode;
}

export function KpiCard({ title, value, subtitle, delta, hue, children }: KpiCardProps) {
  const TrendIcon = delta ? TREND_ICON[delta.trend] : null;

  return (
    <section
      aria-label={title}
      className={`flex min-w-0 flex-col gap-4 rounded-2xl border border-(--border-subtle) p-4 shadow-(--shadow-card) sm:p-6 ${HUE_CLASSES[hue]}`}
    >
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="space-y-2">
        <p className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
          {value ?? KPI_EMPTY_VALUE}
        </p>
        {delta && TrendIcon && (
          <p className="flex items-center gap-1 text-xs font-medium tabular-nums">
            <TrendIcon aria-hidden className="size-4 shrink-0" />
            {delta.text}
          </p>
        )}
        <p className="text-sm leading-relaxed">{subtitle}</p>
      </div>
      {children && <div className="mt-auto">{children}</div>}
    </section>
  );
}
