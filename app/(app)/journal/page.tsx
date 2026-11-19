// app/(app)/journal/page.tsx
import { Suspense } from "react";
import { connection } from "next/server";
import { PageFrame, PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { JournalDay } from "@/features/journal/journal-day";
import { JournalTabs, type JournalTab } from "@/features/journal/journal-tabs";
import { StreakCard } from "@/features/journal/streak-card";
import { TadaburTab } from "@/features/journal/tadabur/tadabur-tab";
import { JOURNAL_KINDS, type JournalKind } from "@/domain/journal/kinds";
import { isValidIsoDate, localIsoDate } from "@/domain/time/local-date";
import { t } from "@/lib/i18n";
import { requireUser } from "@/server/auth/session";
import { env } from "@/server/config/env";
import { getLearningStreak, listJournalDay } from "@/server/services/journal";

type SearchParams = Promise<{
  tab?: string | string[];
  date?: string | string[];
  kind?: string | string[];
}>;

export default function JournalPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <JournalContent searchParams={searchParams} />
    </Suspense>
  );
}

async function JournalContent({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const user = await requireUser();
  const params = await searchParams;

  const today = localIsoDate(new Date(), env.DEFAULT_TIMEZONE);
  const tab: JournalTab = params.tab === "tadabur" ? "tadabur" : "jurnal";
  const rawDate = typeof params.date === "string" ? params.date : "";
  const logDate = isValidIsoDate(rawDate) ? rawDate : today;
  const rawKind = typeof params.kind === "string" ? params.kind : "";
  const kind: JournalKind | undefined = JOURNAL_KINDS.find((option) => option === rawKind);

  return (
    <PageFrame>
      <PageHeader title={t("journal.title")} lead={t("journal.lead")} />
      <div className="mb-6">
        <JournalTabs active={tab} />
      </div>

      {tab === "jurnal" ? (
        <JournalPanel userId={user.id} logDate={logDate} today={today} kind={kind} />
      ) : (
        <TadaburTab userId={user.id} today={today} />
      )}
    </PageFrame>
  );
}

async function JournalPanel({
  userId,
  logDate,
  today,
  kind,
}: {
  readonly userId: string;
  readonly logDate: string;
  readonly today: string;
  readonly kind: JournalKind | undefined;
}) {
  const [entries, streak] = await Promise.all([
    listJournalDay(userId, logDate, kind),
    getLearningStreak(userId, today, env.DEFAULT_TIMEZONE),
  ]);

  return (
    <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <StreakCard streak={streak} />
      <JournalDay entries={entries} logDate={logDate} kind={kind} />
    </div>
  );
}
