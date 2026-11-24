import { Suspense } from "react";
import { connection } from "next/server";
import { PageFrame, PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { t } from "@/lib/i18n";
import { requireUser } from "@/server/auth/session";
import { getDashboard } from "@/server/services/dashboard";

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  await connection();
  const user = await requireUser();
  const data = await getDashboard(user.id);

  return (
    <PageFrame>
      <PageHeader title={t("dashboard.title")} lead={t("dashboard.lead")} />
      <DashboardView userId={user.id} data={data} />
    </PageFrame>
  );
}
