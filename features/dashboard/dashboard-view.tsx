"use client";

import { Fire } from "@/features/learning/fire";
import { t } from "@/lib/i18n";
import { formatPercent, formatPoints } from "@/lib/i18n/format";
import { cn } from "@/lib/ui/cn";
import type { DashboardData } from "@/server/services/dashboard";
import { OPEN_STATUSES } from "@/domain/career/status";

export function DashboardView({ data }: { readonly data: DashboardData }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <WeekPanel data={data} className="lg:col-span-2" />
      <TodayPanel data={data} />
      <OutputPanel data={data} />
      <MissedPanel data={data} />
      <CareerPanel data={data} />
      <LearningPanel data={data} />
      <p className="text-ink-muted text-xs leading-relaxed lg:col-span-3">
        {t("dashboard.privacy")}
      </p>
    </div>
  );
}

function Panel({
  id,
  title,
  className,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly className?: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "space-y-4 rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-4 shadow-(--shadow-card)",
        className,
      )}
    >
      <h2 id={id} className="text-sm font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Plain SVG line. Values are clamped to 0 to 1 and drawn across the full width. */
function Trend({ values, label }: { readonly values: readonly number[]; readonly label: string }) {
  if (values.length < 2) {
    return <p className="text-ink-muted text-xs">{t("dashboard.trend.empty")}</p>;
  }
  const width = 300;
  const height = 60;
  const step = width / (values.length - 1);
  const points = values
    .map((value, index) => {
      const clamped = Math.min(1, Math.max(0, value));
      return `${(index * step).toFixed(1)},${(height - clamped * height).toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="h-16 w-full">
      <polyline
        points={points}
        fill="none"
        className="stroke-accent"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function WeekPanel({
  data,
  className,
}: {
  readonly data: DashboardData;
  readonly className?: string;
}) {
  const { week, calibration, trend } = data;

  return (
    <Panel id="week-title" title={t("dashboard.week.title")} className={className}>
      {week.ratio === null ? (
        <p className="text-ink-muted text-sm leading-relaxed">{t("dashboard.week.none")}</p>
      ) : (
        <>
          <p className="text-4xl font-semibold tracking-[-0.04em] tabular-nums">
            {formatPercent(week.ratio)}
          </p>
          <p className="text-ink-muted text-sm leading-relaxed">
            {t("dashboard.week.sentence", {
              percent: formatPercent(week.ratio),
              recorded: week.recordedDays,
              flexible: week.flexibleDays,
            })}
          </p>
        </>
      )}

      <p className="text-ink-muted text-xs">
        {week.deltaPoints === null
          ? t("dashboard.week.noComparison")
          : t("dashboard.week.vsLast", { points: formatPoints(week.deltaPoints) })}
      </p>

      {!calibration.isCalibrated && (
        <p className="text-ink-muted text-xs leading-relaxed">
          {t("dashboard.calibration", {
            count: calibration.recordedDays,
            required: calibration.requiredDays,
          })}
        </p>
      )}

      <div className="space-y-2 pt-2">
        <p className="text-ink-muted text-xs font-medium">{t("dashboard.trend.title")}</p>
        <Trend values={trend.points.map((point) => point.ewma)} label={t("dashboard.trend.aria")} />
        {trend.latest !== null && (
          <p className="text-ink-muted text-xs tabular-nums">
            {t("dashboard.trend.latest", { percent: formatPercent(trend.latest) })}
          </p>
        )}
        {trend.deltaPrevious !== null && (
          <p className="text-ink-muted text-xs tabular-nums">
            {t("dashboard.trend.delta", { points: formatPoints(trend.deltaPrevious) })}
          </p>
        )}
        {trend.average7 !== null && (
          <p className="text-ink-muted text-xs tabular-nums">
            {t("dashboard.trend.average7", { percent: formatPercent(trend.average7) })}
          </p>
        )}
      </div>
    </Panel>
  );
}

function TodayPanel({ data }: { readonly data: DashboardData }) {
  const today = data.todayChecklist;
  return (
    <Panel id="today-title" title={t("dashboard.today.title")}>
      {today === null || today.planned === 0 ? (
        <p className="text-ink-muted text-sm leading-relaxed">{t("dashboard.today.none")}</p>
      ) : (
        <>
          <p className="text-sm">
            {t("dashboard.today.progress", { completed: today.completed, planned: today.planned })}
          </p>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((today.ratio ?? 0) * 100)}
            className="bg-ink/10 h-1.5 w-full overflow-hidden rounded-full"
          >
            <div
              className="bg-accent h-full rounded-full transition-[width] duration-500"
              style={{ width: `${Math.round((today.ratio ?? 0) * 100)}%` }}
            />
          </div>
        </>
      )}
    </Panel>
  );
}

function OutputPanel({ data }: { readonly data: DashboardData }) {
  const { output } = data;
  return (
    <Panel id="output-title" title={t("dashboard.output.title")}>
      <p className="text-sm leading-relaxed">
        {t("dashboard.output.deep", { minutes: output.deepMinutes })}
      </p>
      <p className="text-sm leading-relaxed">
        {t("dashboard.output.reading", {
          units: output.readingUnits,
          minutes: output.readingMinutes,
        })}
      </p>
    </Panel>
  );
}

function MissedPanel({ data }: { readonly data: DashboardData }) {
  return (
    <Panel id="missed-title" title={t("dashboard.missed.title")}>
      {data.misses.length === 0 ? (
        <p className="text-ink-muted text-sm">{t("dashboard.missed.none")}</p>
      ) : (
        <ul className="space-y-2">
          {data.misses.map((miss) => (
            <li key={miss.title} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate">{miss.title}</span>
              <span className="text-ink-muted shrink-0 tabular-nums">
                {t("dashboard.missed.count", { count: miss.count })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function CareerPanel({ data }: { readonly data: DashboardData }) {
  const open = data.career.followUp; // open count is computed from counts below
  const openCount = OPEN_STATUSES.reduce(
    (sum, status) => sum + (data.career.counts[status] ?? 0),
    0,
  );
  return (
    <Panel id="career-title" title={t("dashboard.career.title")}>
      <p className="text-sm">{t("dashboard.career.open", { count: openCount })}</p>
      <p className="text-ink-muted text-sm">{t("dashboard.career.followUp", { count: open })}</p>
    </Panel>
  );
}

function LearningPanel({ data }: { readonly data: DashboardData }) {
  const { learning } = data;
  return (
    <Panel id="learning-title" title={t("dashboard.learning.title")}>
      <div className="flex items-center gap-4">
        <Fire level={learning.level} streak={learning.current} />
        <div className="space-y-1">
          <p className="text-lg font-semibold tabular-nums">
            {learning.current === 0
              ? t("streak.none")
              : t(learning.current === 1 ? "streak.days.one" : "streak.days.other", {
                  count: learning.current,
                })}
          </p>
          <p className="text-ink-muted text-xs">{t(`streak.level.${learning.level}`)}</p>
        </div>
      </div>
      <p className="text-ink-muted text-xs leading-relaxed">{t("dashboard.learning.hint")}</p>
    </Panel>
  );
}
