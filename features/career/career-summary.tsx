// features/career/career-summary.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { OPEN_STATUSES } from "@/domain/career/status";
import { t } from "@/lib/i18n";
import { useCareerSummary } from "./use-career";

export function CareerSummary({ userId }: { readonly userId: string }) {
  const summary = useCareerSummary(userId);

  if (summary.isPending) return <Skeleton className="h-24" />;
  if (summary.isError || !summary.data) {
    return (
      <p role="alert" className="text-negative text-sm">
        {t("career.summary.error")}
      </p>
    );
  }

  const { counts, followUp } = summary.data;
  const active = OPEN_STATUSES.reduce((sum, status) => sum + (counts[status] ?? 0), 0);

  return (
    <section
      aria-labelledby="summary-title"
      className="space-y-3 rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-4 shadow-(--shadow-card)"
    >
      <h2 id="summary-title" className="text-sm font-semibold">
        {t("career.summary.title")}
      </h2>
      <dl className="grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-ink-muted text-xs">{t("career.summary.active")}</dt>
          <dd className="text-2xl font-semibold tabular-nums">{active}</dd>
        </div>
        <div>
          <dt className="text-ink-muted text-xs">{t("career.summary.followUp")}</dt>
          <dd className="text-2xl font-semibold tabular-nums">{followUp}</dd>
        </div>
        <div>
          <dt className="text-ink-muted text-xs">{t("career.summary.offers")}</dt>
          <dd className="text-2xl font-semibold tabular-nums">{counts.OFFER ?? 0}</dd>
        </div>
      </dl>
    </section>
  );
}
