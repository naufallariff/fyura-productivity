import { Suspense } from "react";
import { PageFrame, PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { WeekBoard } from "@/features/weekly-plan/week-board";
import { t } from "@/lib/i18n";
import { requireUser } from "@/server/auth/session";

export default function WeeklyPlanPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <WeeklyPlanContent />
    </Suspense>
  );
}

async function WeeklyPlanContent() {
  const user = await requireUser();

  return (
    <PageFrame>
      <PageHeader title={t("weeklyPlan.title")} lead={t("weeklyPlan.lead")} />
      <WeekBoard userId={user.id} />
    </PageFrame>
  );
}
