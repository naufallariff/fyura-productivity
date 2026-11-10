import { PageShell } from "@/components/shell/page-shell";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await requireUser();
  return (
    <PageShell title="Dashboard" email={user.email}>
      <p className="text-muted text-sm">Dashboard content arrives in Phase 1.</p>
    </PageShell>
  );
}
