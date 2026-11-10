import { Suspense } from "react";
import { PageShell } from "@/components/shell/page-shell";
import { PageSkeleton } from "@/components/shell/skeleton";
import { requireUser } from "@/lib/auth/session";

async function DashboardContent() {
  const user = await requireUser();
  return (
    <PageShell title="Dashboard" email={user.email}>
      <p className="text-muted text-sm">Dashboard content arrives in Phase 1.</p>
    </PageShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
