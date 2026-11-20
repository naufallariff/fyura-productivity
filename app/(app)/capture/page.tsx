// app/(app)/capture/page.tsx
import { Suspense } from "react";
import { connection } from "next/server";
import { PageFrame, PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { CapturePanel } from "@/features/capture/capture-panel";
import { t } from "@/lib/i18n";
import { requireUser } from "@/server/auth/session";

export default function CapturePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CaptureContent />
    </Suspense>
  );
}

async function CaptureContent() {
  await connection();
  const user = await requireUser();
  return (
    <PageFrame>
      <PageHeader title={t("capture.title")} lead={t("capture.lead")} />
      <CapturePanel userId={user.id} />
    </PageFrame>
  );
}
