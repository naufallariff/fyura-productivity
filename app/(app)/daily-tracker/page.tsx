import { Suspense } from "react";
import { connection } from "next/server";
import { PageFrame, PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { DailyTrackerWorkspace, type TrackerView } from "@/features/daily-tracker/workspace";
import { localIsoDate, isValidIsoDate } from "@/domain/time/local-date";
import { t } from "@/lib/i18n";
import { env } from "@/server/config/env";
import { requireUser } from "@/server/auth/session";

type SearchParams = Promise<{ date?: string | string[]; view?: string | string[] }>;

export default function DailyTrackerPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DailyTrackerContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DailyTrackerContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  await connection();

  const params = await searchParams;
  const today = localIsoDate(new Date(), env.DEFAULT_TIMEZONE);
  const date = typeof params.date === "string" && isValidIsoDate(params.date) ? params.date : today;
  const view: TrackerView = params.view === "week" ? "week" : "day";

  return (
    <PageFrame>
      <PageHeader title={t("dailyTracker.title")} lead={t("dailyTracker.lead")} />
      <DailyTrackerWorkspace
        userId={user.id}
        logDate={date}
        view={view}
        today={today}
        timeZone={env.DEFAULT_TIMEZONE}
      />
    </PageFrame>
  );
}
