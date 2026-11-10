import { formatPercent } from "@/lib/i18n/format";
import { t } from "@/lib/i18n";
import type { DayScore } from "@/lib/scoring/types";

export function DaySummaryCard({ score }: { score: DayScore }) {
  return (
    <section
      aria-labelledby="day-summary-title"
      className="elevated rounded-card border-line bg-surface border p-6"
    >
      <h2 id="day-summary-title" className="text-sm font-semibold">
        {t("today.summary.title")}
      </h2>

      {score.planned === 0 || score.ratio === null ? (
        <p className="text-muted mt-4 text-sm">{t("today.summary.none")}</p>
      ) : (
        <>
          <p className="mt-4 text-[34px] font-semibold tracking-[-0.03em] tabular-nums">
            {formatPercent(score.ratio)}
          </p>
          <p className="text-muted mt-1 text-sm">
            {t("today.summary.progress", {
              completed: Math.round(score.completed),
              planned: score.planned,
            })}
          </p>
        </>
      )}
    </section>
  );
}
