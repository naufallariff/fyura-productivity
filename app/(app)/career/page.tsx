// app/(app)/career/page.tsx
import { Suspense } from "react";
import { connection } from "next/server";
import { PageFrame, PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { CareerSummary } from "@/features/career/career-summary";
import { JobBoard } from "@/features/career/job-board";
import { JobTable } from "@/features/career/job-table";
import { t } from "@/lib/i18n";
import { requireUser } from "@/server/auth/session";

export default function CareerPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CareerContent />
    </Suspense>
  );
}

async function CareerContent() {
  await connection();
  const user = await requireUser();

  return (
    <PageFrame>
      <PageHeader title={t("career.title")} lead={t("career.lead")} />
      <div className="space-y-8">
        <CareerSummary userId={user.id} />
        <JobBoard userId={user.id} />
        <JobTable userId={user.id} />
      </div>
    </PageFrame>
  );
}
