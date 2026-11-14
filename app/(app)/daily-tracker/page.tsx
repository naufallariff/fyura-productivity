import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageShell } from "@/components/shell/page-shell";
import { PageSkeleton } from "@/components/shell/skeleton";
import { DaySummaryCard } from "@/components/today/day-summary";
import { DayStatusCard } from "@/components/today/day-status";
import { TodayWorkspace } from "@/components/today/workspace";
import type { GridBlock } from "@/components/today/day-grid";
import { requireUser } from "@/lib/auth/session";
import { env } from "@/lib/config/env";
import { toCategory } from "@/lib/habits/categories";
import { t } from "@/lib/i18n";
import { scoreDay } from "@/lib/scoring/daily";
import { getDayView, getScoringInput } from "@/lib/services/daily";
import { addDays } from "@/lib/time/logical-date";
import { isValidIsoDate, localIsoDate } from "@/lib/time/local-date";

type SearchParams = Promise<{ date?: string | string[] }>;

export default function TodayPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TodayContent searchParams={searchParams} />
    </Suspense>
  );
}

async function TodayContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  await connection();

  const { date } = await searchParams;
  const today = localIsoDate(new Date(), env.DEFAULT_TIMEZONE);
  const logDate = typeof date === "string" && isValidIsoDate(date) ? date : today;

  const [view, scoring] = await Promise.all([
    getDayView(user.id, logDate),
    getScoringInput(user.id, logDate, logDate),
  ]);

  const day = scoring.days[0];
  if (!day) throw new Error("Scoring input returned no day");
  const score = scoreDay(day, scoring.habits);

  const grid: GridBlock[] = view.blocks.map((block) => ({
    id: block.id,
    startMinute: block.startMinute,
    endMinute: block.endMinute,
    activity: block.activity,
    category: toCategory(block.category),
    editable: block.splitGroupId === null,
  }));

  const loggedMinutes = grid.reduce((sum, b) => sum + (b.endMinute - b.startMinute), 0);

  const dateLabel = new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${logDate}T00:00:00Z`));

  return (
    <PageShell title={t("today.title")} email={user.email}>
      <div className="flex items-center gap-2">
        <Link
          href={`/today?date=${addDays(logDate, -1)}`}
          aria-label={t("today.dateNav.previous")}
          className="text-muted hover:bg-surface-raised grid size-9 place-items-center rounded-full transition-colors"
        >
          <ChevronLeft aria-hidden className="size-4" />
        </Link>
        <div className="min-w-0">
          <p className="text-lg font-semibold tracking-[-0.01em]">{dateLabel}</p>
          {logDate !== today && (
            <Link href="/today" className="text-accent text-xs font-medium">
              {t("today.dateNav.today")}
            </Link>
          )}
        </div>
        <Link
          href={`/today?date=${addDays(logDate, 1)}`}
          aria-label={t("today.dateNav.next")}
          className="text-muted hover:bg-surface-raised grid size-9 place-items-center rounded-full transition-colors"
        >
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="elevated rounded-card border-line bg-surface/90 border p-5 backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t("today.timeline.title")}</h2>
            <p className="text-muted text-xs tabular-nums">
              {t("today.logged.total", { minutes: loggedMinutes })}
            </p>
          </div>
          <TodayWorkspace logDate={logDate} blocks={grid} />
        </section>

        <div className="space-y-5">
          <DayStatusCard logDate={logDate} current={view.status} />
          <DaySummaryCard score={score} />
        </div>
      </div>
    </PageShell>
  );
}
