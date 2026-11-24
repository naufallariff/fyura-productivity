"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Flame } from "lucide-react";
import { MiniMonth } from "@/components/dashboard/mini-month";
import { KpiCard, KPI_EMPTY_VALUE } from "@/components/ui/kpi-card";
import { Sparkline } from "@/components/ui/sparkline";
import { FOLLOW_UP_AFTER_DAYS, OPEN_STATUSES } from "@/domain/career/status";
import { scoreChecklistDay } from "@/domain/scoring/checklist";
import { EmbeddablePomodoroTimer } from "@/features/daily-tracker/pomodoro/timer";
import { useChecklist, useSetChecklistItem } from "@/features/daily-tracker/use-daily-tracker";
import { DEFAULT_LOCALE, t, tPlural } from "@/lib/i18n";
import { formatPercent, formatPoints } from "@/lib/i18n/format";
import { cn } from "@/lib/ui/cn";
import type { DashboardData } from "@/server/services/dashboard";

const WORKSPACE_LINK = "rounded-lg py-2 text-sm font-medium text-accent hover:underline";
const HOURS = new Intl.NumberFormat(DEFAULT_LOCALE, { maximumFractionDigits: 2 });

export function DashboardView({
  userId,
  data,
}: {
  readonly userId: string;
  readonly data: DashboardData;
}) {
  return (
    <div className="grid gap-4 sm:gap-6">
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
        <ConsistencyCard data={data} />
        <TrendCard data={data} />
        <FocusCard focus={data.focus} />
        <StreakCard data={data} />
      </div>

      <div className="grid items-start gap-4 sm:gap-6 lg:grid-cols-12">
        <div className="grid min-w-0 gap-4 sm:gap-6 lg:col-span-8">
          <ExecutionLog userId={userId} data={data} />
          <ActiveProjects projects={data.projects} />
        </div>
        <div className="grid min-w-0 gap-4 sm:gap-6 lg:col-span-4">
          <Panel id="dashboard-calendar" title={t("dashboard.calendar.title")}>
            <MiniMonth today={data.today} recordedDates={data.recordedDates} />
          </Panel>
          <EmbeddablePomodoroTimer logDate={data.today} timeZone={data.timeZone} />
        </div>
      </div>
    </div>
  );
}

function Panel({
  id,
  title,
  action,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly action?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-4 rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-4 shadow-(--shadow-card) sm:gap-6 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4">
        <h2 id={id} className="font-semibold">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ConsistencyCard({ data }: { readonly data: DashboardData }) {
  const { week, calibration } = data;
  const points = week.deltaPoints;

  return (
    <KpiCard
      title={t("dashboard.kpi.consistency.title")}
      value={calibration.isCalibrated && week.ratio !== null ? formatPercent(week.ratio) : null}
      subtitle={
        calibration.isCalibrated
          ? t("dashboard.kpi.consistency.baseline", { count: week.recordedDays })
          : t("dashboard.kpi.consistency.calibrating", {
              count: calibration.recordedDays,
              required: calibration.requiredDays,
            })
      }
      hue="consistency"
      delta={
        points === null
          ? null
          : {
              text: t("dashboard.week.vsLast", { points: formatPoints(points) }),
              trend: points === 0 ? "flat" : points > 0 ? "up" : "down",
            }
      }
    >
      {!calibration.isCalibrated && (
        <span className="inline-flex rounded-full border border-current/25 px-2 py-1 text-xs font-medium">
          {t("dashboard.kpi.calibration")}
        </span>
      )}
    </KpiCard>
  );
}

const TREND_DATES = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function TrendCard({ data }: { readonly data: DashboardData }) {
  const { trend, calibration } = data;
  const latest = calibration.isCalibrated ? trend.latest : null;
  return (
    <KpiCard
      title={t("dashboard.kpi.trend.title")}
      value={latest === null ? null : formatPercent(latest)}
      subtitle={t(
        latest === null ? "dashboard.kpi.trend.calibrating" : "dashboard.kpi.trend.baseline",
        {
          required: calibration.requiredDays,
        },
      )}
      hue="trend"
    >
      {latest !== null && trend.points.length > 1 && (
        <Sparkline
          values={trend.points.map(({ ewma }) => ewma)}
          label={t("dashboard.trend.aria")}
          range={[0, 1]}
          tone="current"
          formatValue={(value, index) =>
            t("dashboard.kpi.trend.point", {
              percent: formatPercent(value),
              date: TREND_DATES.format(new Date(`${trend.points[index]?.date}T00:00:00Z`)),
            })
          }
        />
      )}
    </KpiCard>
  );
}

function FocusCard({ focus }: { readonly focus: DashboardData["focus"] }) {
  const { completedMinutes, targetMinutes } = focus;
  const completed = HOURS.format(completedMinutes / 60);
  const hasTarget = targetMinutes > 0;
  const value = hasTarget
    ? t("dashboard.kpi.focus.progress", { completed, target: HOURS.format(targetMinutes / 60) })
    : completedMinutes > 0
      ? t("dashboard.kpi.focus.hours", { hours: completed })
      : null;

  return (
    <KpiCard
      title={t("dashboard.kpi.focus.title")}
      value={value}
      subtitle={t(hasTarget ? "dashboard.kpi.focus.baseline" : "dashboard.kpi.focus.noTarget")}
      hue="focus"
    >
      <svg viewBox="0 0 48 48" className="size-12" fill="none" aria-hidden>
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="5" opacity="0.2" />
        {hasTarget && completedMinutes > 0 && (
          <circle
            cx="24"
            cy="24"
            r="20"
            pathLength="100"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${Math.min(100, (completedMinutes / targetMinutes) * 100)} 100`}
            transform="rotate(-90 24 24)"
          />
        )}
      </svg>
    </KpiCard>
  );
}

function StreakCard({ data }: { readonly data: DashboardData }) {
  const { learning, career } = data;
  const hasOpenApplications = OPEN_STATUSES.some((status) => career.counts[status] > 0);
  return (
    <KpiCard
      title={t("dashboard.kpi.streak.title")}
      value={
        learning.best > 0 ? (
          <span className="inline-flex items-center gap-2">
            {learning.current > 0 && <Flame className="size-6 shrink-0" aria-hidden />}
            {tPlural("streak.days", learning.current)}
          </span>
        ) : null
      }
      subtitle={t("dashboard.learning.hint")}
      hue="streak"
    >
      <p className="border-t border-current/25 pt-2 text-sm tabular-nums">
        <Link href="/career" className="rounded-sm font-medium hover:underline">
          {t("dashboard.kpi.streak.followUps", {
            count: hasOpenApplications ? career.followUp : KPI_EMPTY_VALUE,
          })}
        </Link>
        <span className="mt-1 block text-xs">
          {t("dashboard.kpi.streak.followUpBaseline", { days: FOLLOW_UP_AFTER_DAYS })}
        </span>
      </p>
    </KpiCard>
  );
}

function ExecutionLog({ userId, data }: { readonly userId: string; readonly data: DashboardData }) {
  const router = useRouter();
  const checklist = useChecklist(userId, data.today, data.checklist).data ?? data.checklist;
  const toggle = useSetChecklistItem(userId);
  const score = scoreChecklistDay(
    data.today,
    checklist.status,
    checklist.items.map((item) => ({
      required: item.isRequired,
      core: item.isCore,
      done: item.isDone,
    })),
  );

  return (
    <Panel
      id="dashboard-execution"
      title={t("dashboard.execution.title")}
      action={
        <Link
          href={{ pathname: "/daily-tracker", query: { date: data.today } }}
          className={WORKSPACE_LINK}
        >
          {t("nav.dailyTracker")}
        </Link>
      }
    >
      {score.planned > 0 && (
        <p className="text-ink-muted text-sm tabular-nums">
          {t("dashboard.today.progress", { completed: score.completed, planned: score.planned })}
        </p>
      )}
      {checklist.items.length === 0 ? (
        <div className="text-ink-muted space-y-2 text-sm">
          <p>{t("dashboard.today.none")}</p>
          <Link href="/weekly-plan" className={WORKSPACE_LINK}>
            {t("checklist.emptyLink")}
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-(--border-subtle)">
          {checklist.items.map((item) => (
            <li key={item.sourceItemId ?? item.id}>
              <label className="flex min-h-11 items-center gap-2 py-2 text-sm has-enabled:cursor-pointer">
                <span className="relative grid size-5 shrink-0 place-items-center">
                  <input
                    type="checkbox"
                    checked={item.isDone}
                    disabled={item.sourceItemId === null}
                    aria-disabled={toggle.isPending || undefined}
                    onChange={(event) => {
                      if (!item.sourceItemId || toggle.isPending) return;
                      toggle.mutate(
                        {
                          logDate: data.today,
                          sourceItemId: item.sourceItemId,
                          done: event.target.checked,
                        },
                        { onSuccess: () => router.refresh() },
                      );
                    }}
                    className="peer checked:border-accent checked:bg-accent size-5 appearance-none rounded-sm border border-(--border-control) disabled:opacity-60"
                  />
                  <Check
                    aria-hidden
                    className="text-on-accent pointer-events-none absolute hidden size-4 peer-checked:block"
                  />
                </span>
                <span
                  className={cn(
                    "min-w-0 wrap-anywhere",
                    item.isDone && "text-ink-muted line-through",
                  )}
                >
                  {item.title}
                </span>
                {item.sourceItemId === null && (
                  <span className="text-ink-muted ms-auto text-xs">{t("checklist.unlinked")}</span>
                )}
              </label>
            </li>
          ))}
        </ul>
      )}
      {toggle.isError && (
        <p role="alert" className="text-negative text-sm">
          {t("checklist.error")}
        </p>
      )}
      <WeeklyDetails data={data} />
    </Panel>
  );
}

function WeeklyDetails({ data }: { readonly data: DashboardData }) {
  const { output, misses } = data;
  return (
    <details className="text-ink-muted border-t border-(--border-subtle) pt-2 text-sm">
      <summary className="w-fit cursor-pointer rounded-sm py-2 font-medium">
        {t("dashboard.execution.weeklyDetails")}
      </summary>
      <div className="space-y-4 pt-2 pb-2">
        <div className="space-y-1 tabular-nums">
          <p>{t("dashboard.output.deep", { minutes: output.deepMinutes })}</p>
          <p>
            {t("dashboard.output.reading", {
              units: output.readingUnits,
              minutes: output.readingMinutes,
            })}
          </p>
        </div>
        {misses.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium">{t("dashboard.missed.title")}</p>
            <ul className="space-y-1">
              {misses.map(({ title, count }) => (
                <li key={title} className="flex justify-between gap-2 tabular-nums">
                  <span className="min-w-0 wrap-anywhere">{title}</span>
                  <span className="shrink-0">{t("dashboard.missed.count", { count })}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}

function ActiveProjects({ projects }: { readonly projects: DashboardData["projects"] }) {
  return (
    <Panel
      id="dashboard-projects"
      title={t("dashboard.projects.title")}
      action={
        <Link href="/projects" className={WORKSPACE_LINK}>
          {t("nav.projects")}
        </Link>
      }
    >
      {projects.length === 0 ? (
        <p className="text-ink-muted text-sm">{t("dashboard.projects.empty")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {projects.map(({ id, title, done, total }) => (
            <li key={id} className="min-w-0">
              <Link
                href={`/projects/${id}`}
                className="grid min-h-11 gap-2 rounded-lg border border-(--border-subtle) p-4 hover:bg-(--bg-surface-elevated)"
              >
                <span className="text-sm font-medium wrap-anywhere">{title}</span>
                <span className="text-ink-muted text-xs tabular-nums">
                  {total === 0
                    ? t("dashboard.projects.noChecklist")
                    : t("dashboard.projects.progress", { done, total })}
                </span>
                {total > 0 && (
                  <span aria-hidden className="bg-accent-soft h-1 overflow-hidden rounded-full">
                    <span
                      className="bg-accent block h-full origin-left rounded-full"
                      style={{ transform: `scaleX(${done / total})` }}
                    />
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
