"use client";

import Link from "next/link";
import { Check, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { Ring } from "@/components/ui/ring";
import { Segmented, type SegmentedOption } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryLabelKey } from "@/domain/categories";
import { scoreChecklistDay, weeklyChecklistRatio } from "@/domain/scoring/checklist";
import { DAY_STATUSES, type DayStatus } from "@/domain/scoring/types";
import { weekOf } from "@/domain/time/week";
import { t } from "@/lib/i18n";
import { formatPercent } from "@/lib/i18n/format";
import { cn } from "@/lib/ui/cn";
import { CATEGORY_HUE } from "../category-hue";
import { useSetDayStatus } from "../use-daily-data";
import { useChecklist, useChecklistScores, useSetChecklistItem } from "../use-daily-tracker";

export function ChecklistPanel({ userId, logDate }: { userId: string; logDate: string }) {
  const checklist = useChecklist(userId, logDate);
  const toggle = useSetChecklistItem(userId);
  const status = useSetDayStatus(userId);

  const week = weekOf(logDate);
  const weekStart = week[0] ?? logDate;
  const weekEnd = week[6] ?? logDate;
  const weekScores = useChecklistScores(userId, weekStart, weekEnd);

  if (checklist.isPending) {
    return (
      <div aria-busy="true" className="space-y-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (checklist.isError) {
    return (
      <EmptyState
        icon={ListChecks}
        title={t("checklist.loadError")}
        action={
          <Button variant="secondary" onClick={() => checklist.refetch()}>
            {t("common.retry")}
          </Button>
        }
      />
    );
  }

  const view = checklist.data;
  const shownStatus: DayStatus =
    status.isPending && status.variables ? status.variables.status : view.status;

  const score = scoreChecklistDay(
    logDate,
    shownStatus,
    view.items.map((item) => ({
      required: item.isRequired,
      core: item.isCore,
      done: item.isDone,
    })),
  );

  const weekly = weeklyChecklistRatio(weekScores.data ?? []);

  const statusOptions: SegmentedOption<DayStatus>[] = DAY_STATUSES.map((value) => ({
    value,
    label: t(`dailyTracker.status.${value}`),
  }));

  return (
    <section aria-labelledby="checklist-title" className="space-y-5">
      <header className="space-y-1">
        <h2 id="checklist-title" className="text-sm font-semibold">
          {t("checklist.title")}
        </h2>
        <p className="text-ink-muted text-xs leading-relaxed">{t("checklist.lead")}</p>
      </header>

      <div className="flex items-center gap-4">
        <Ring value={score.ratio ?? 0} label={t("checklist.score")} size={96} stroke={9}>
          <span className="text-center text-sm font-semibold tabular-nums">
            {score.ratio === null ? t("checklist.scoreNone") : formatPercent(score.ratio)}
          </span>
        </Ring>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium">{t("checklist.score")}</p>
          <p className="text-ink-muted text-xs tabular-nums">
            {score.ratio === null
              ? t("checklist.scoreNone")
              : t("checklist.progress", { completed: score.completed, planned: score.planned })}
          </p>
          <p className="text-ink-muted text-xs tabular-nums">
            {weekly === null
              ? t("checklist.weekNone")
              : t("checklist.week", { percent: formatPercent(weekly) })}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-ink-muted text-xs font-medium tracking-wide uppercase">
          {t("dailyTracker.status.label")}
        </p>
        <Segmented
          label={t("dailyTracker.status.label")}
          options={statusOptions}
          value={shownStatus}
          onChange={(next) => status.mutate({ logDate, status: next })}
        />
      </div>

      <p className="text-ink-muted text-xs leading-relaxed">
        {view.frozen ? t("checklist.frozen") : t("checklist.live")}
      </p>

      {view.items.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={t("checklist.empty")}
          action={
            <Link
              href="/weekly-plan"
              className="rounded-control bg-accent text-on-accent px-4 py-2 text-sm font-medium"
            >
              {t("checklist.emptyLink")}
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {view.items.map((item) => {
            const pending =
              toggle.isPending && toggle.variables?.sourceItemId === item.sourceItemId;
            const unlinked = item.sourceItemId === null;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={item.isDone}
                  disabled={unlinked || pending}
                  onClick={() => {
                    if (item.sourceItemId) {
                      toggle.mutate({
                        logDate,
                        sourceItemId: item.sourceItemId,
                        done: !item.isDone,
                      });
                    }
                  }}
                  className="border-line focus-visible:ring-accent rounded-control flex min-h-11 w-full items-center gap-3 border p-3 text-left transition-colors duration-150 focus-visible:ring-2 disabled:opacity-60"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full border",
                      item.isDone ? "border-positive bg-positive text-on-accent" : "border-line",
                    )}
                  >
                    {item.isDone && <Check className="size-3.5" strokeWidth={2.5} />}
                  </span>
                  <span className="min-w-0 flex-1 space-y-1.5">
                    <span
                      className={cn(
                        "block truncate text-sm font-medium",
                        item.isDone && "text-ink-muted line-through",
                      )}
                    >
                      {item.title}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      <Pill hue={CATEGORY_HUE[item.category]}>
                        {t(categoryLabelKey(item.category))}
                      </Pill>
                      {!item.isRequired && <Pill>{t("weeklyPlan.optional")}</Pill>}
                      {unlinked && <Pill tone="warning">{t("checklist.unlinked")}</Pill>}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {toggle.isError && (
        <p role="alert" className="text-negative text-sm">
          {t("checklist.error")}
        </p>
      )}
    </section>
  );
}
