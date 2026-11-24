import { Suspense } from "react";
import { connection } from "next/server";
import { PageFrame, PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { lockPrivateAction, setupPinAction, unlockPrivateAction } from "@/features/private/actions";
import { IdleGuard } from "@/features/private/components/idle-guard";
import { LockedPlaceholder } from "@/features/private/components/locked-placeholder";
import { PinModal } from "@/features/private/components/pin-modal";
import { SessionRing } from "@/features/private/components/session-ring";
import { t } from "@/lib/i18n";
import { requireUser } from "@/server/auth/session";
import { hasPrivatePin } from "@/server/private/gate";
import { getPrivateExpiry } from "@/server/private/guard";

export default function PrivatePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PrivateContent />
    </Suspense>
  );
}

async function PrivateContent() {
  await connection();
  const user = await requireUser();

  const header = <PageHeader title={t("privateSpace.title")} lead={t("privateSpace.lead")} />;

  if (!(await hasPrivatePin(user.id))) {
    return (
      <PageFrame>
        {header}
        <LockedPlaceholder />
        <PinModal mode="setup" action={setupPinAction} />
      </PageFrame>
    );
  }

  const expiresAt = await getPrivateExpiry(user.id);
  if (expiresAt === null) {
    return (
      <PageFrame>
        {header}
        <LockedPlaceholder />
        <PinModal mode="unlock" action={unlockPrivateAction} />
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      {header}
      <IdleGuard>
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-4 shadow-(--shadow-card)">
          <SessionRing expiresAt={expiresAt} />
          <form action={lockPrivateAction}>
            <button
              type="submit"
              className="border-line hover:bg-accent-soft focus-visible:ring-accent rounded-lg border px-4 py-2 text-sm font-medium focus-visible:ring-2"
            >
              {t("privateSpace.session.lock")}
            </button>
          </form>
        </section>

        <section className="mt-6 rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-4 shadow-(--shadow-card)">
          <p className="text-ink-muted text-sm leading-relaxed">{t("privateSpace.placeholder")}</p>
        </section>
      </IdleGuard>
    </PageFrame>
  );
}
