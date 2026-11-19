import { Suspense } from "react";
import { connection } from "next/server";
import { PageFrame, PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { BoardIndex } from "@/features/projects/board-index";
import { t } from "@/lib/i18n";
import { requireUser } from "@/server/auth/session";

export default function ProjectsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProjectsContent />
    </Suspense>
  );
}

async function ProjectsContent() {
  await connection();
  const user = await requireUser();

  return (
    <PageFrame>
      <PageHeader title={t("projects.title")} lead={t("projects.lead")} />
      <BoardIndex userId={user.id} />
    </PageFrame>
  );
}
