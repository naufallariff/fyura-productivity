import { Suspense } from "react";
import { PageShell } from "@/components/shell/page-shell";
import { PageSkeleton } from "@/components/shell/skeleton";
import { Card, Delta, TrendSparkline } from "@/components/dashboard/cards";
import { requireUser } from "@/lib/auth/session";
import { env } from "@/lib/config/env";
import { t, tPlural } from "@/lib/i18n";
import { formatPercent, formatPoints } from "@/lib/i18n/format";
import { buildDashboard } from "@/lib/scoring/dashboard";
import { getDashboardInput } from "@/lib/services/daily";
import { localIsoDate } from "@/lib/time/local-date";

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  // requireUser() marks the render as request-time before any date is read.
  const user = await requireUser();
  const today = localIsoDate(new Date(), env.DEFAULT_TIMEZONE);

  const { habits, days } = await getDashboardInput(user.id, today);
  const m = buildDashboard(habits as never, days, today);

  const weekPercent = m.week.ratio === null ? "—" : formatPercent(m.week.ratio);
  const versusLastWeek =
    m.week.ratio !== null && m.priorWeekRatio !== null
      ? (m.week.ratio - m.priorWeekRatio) * 100
      : null;

  return (
    <PageShell title={t("dashboard.title")} email={user.email}>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Card title={t("dashboard.hero.label")} className="md:col-span-2">
          {m.calibration.isCalibrated ? (
            <>
              <p className="from-accent to-danger bg-linear-to-r bg-clip-text text-[64px] leading-none font-semibold tracking-[-0.04em] text-transparent tabular-nums">
                {weekPercent}
              </p>
              <p className="text-muted mt-3 text-sm">
                {t("dashboard.hero.sentence", {
                  percent: weekPercent,
                  recorded: m.week.recorded,
                  flexible: m.week.flexible,
                })}
              </p>
              <p className="mt-4 text-sm">
                {versusLastWeek === null
                  ? t("dashboard.hero.noPrior")
                  : t("dashboard.hero.vsLastWeek", { value: formatPoints(versusLastWeek) })}
              </p>
            </>
          ) : (
            <p className="text-muted text-sm">
              {t("dashboard.hero.calibrating", {
                count: m.calibration.recordedDays,
                required: m.calibration.requiredDays,
              })}
            </p>
          )}
        </Card>

        <Card title={t("dashboard.today.label")}>
          <p className="text-[40px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
            {m.today.ratio === null ? "—" : formatPercent(m.today.ratio)}
          </p>
          <p className="text-muted mt-3 text-sm">
            {m.today.ratio === null
              ? t("dashboard.today.none")
              : t("dashboard.today.progress", {
                  completed: Math.round(m.today.completed),
                  planned: m.today.planned,
                })}
          </p>
        </Card>

        <Card title={t("dashboard.trend.label")} className="md:col-span-2 xl:col-span-2">
          {m.trend.length >= 2 ? (
            <TrendSparkline points={m.trend} label={t("dashboard.trend.aria")} />
          ) : (
            <p className="text-muted py-10 text-sm">{t("dashboard.trend.empty")}</p>
          )}
        </Card>

        <Card title={t("dashboard.compare.label")}>
          <div className="space-y-5">
            <div>
              <p className="text-muted text-xs">{t("dashboard.metric.vsYesterday")}</p>
              <Delta value={m.deltaVsYesterday} />
            </div>
            <div>
              <p className="text-muted text-xs">{t("dashboard.metric.vsAverage7")}</p>
              <Delta value={m.deltaVsAverage7} />
            </div>
          </div>
        </Card>

        <Card title={t("dashboard.missed.label")}>
          {m.mostMissed.length === 0 ? (
            <p className="text-muted text-sm">{t("dashboard.missed.none")}</p>
          ) : (
            <ul className="space-y-3">
              {m.mostMissed.map((item) => (
                <li key={item.habitId} className="flex items-center justify-between gap-4 text-sm">
                  <span className="truncate">{item.name}</span>
                  <span className="text-muted tabular-nums">
                    {tPlural("dashboard.missed.count", item.misses)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
