import { Suspense } from "react";
import { connection } from "next/server";
import { PageFrame, PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { LearningTabs, type LearningTab } from "@/features/learning/learning-tabs";
import { MaterialsPanel } from "@/features/learning/materials-panel";
import { ReviewsPanel } from "@/features/learning/reviews-panel";
import { t } from "@/lib/i18n";
import { requireUser } from "@/server/auth/session";
import { getUserDay } from "@/server/services/user";

type SearchParams = Promise<{ tab?: string | string[] }>;

export default function LearningPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LearningContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LearningContent({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const user = await requireUser();
  const { today } = await getUserDay(user.id);
  const params = await searchParams;
  const tab: LearningTab = params.tab === "ulasan" ? "ulasan" : "materi";

  return (
    <PageFrame>
      <PageHeader title={t("learning.title")} lead={t("learning.lead")} />
      <div className="mb-6">
        <LearningTabs active={tab} />
      </div>
      {tab === "materi" ? (
        <MaterialsPanel userId={user.id} today={today} />
      ) : (
        <ReviewsPanel userId={user.id} />
      )}
    </PageFrame>
  );
}
