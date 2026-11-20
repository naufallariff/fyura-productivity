import { Suspense } from "react";
import { connection } from "next/server";
import { PageFrame, PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { DailyTrackerWorkspace, type TrackerView } from "@/features/daily-tracker/workspace";
import { isValidIsoDate } from "@/domain/time/local-date";
import { t } from "@/lib/i18n";
import { requireUser } from "@/server/auth/session";
import { getUserDay } from "@/server/services/user";

type SearchParams = Promise<{ date?: string | string[]; view?: string | string[] }>;

export default function DailyTrackerPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DailyTrackerContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DailyTrackerContent({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const user = await requireUser();
  const { timeZone, today } = await getUserDay(user.id);
  const params = await searchParams;

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
        timeZone={timeZone}
      />
    </PageFrame>
  );
}
