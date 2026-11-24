import { Suspense } from "react";
import { connection } from "next/server";
import { PageFrame, PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { setupPinAction, unlockPrivateAction, type PinLockout } from "@/features/private/actions";
import { IdleGuard } from "@/features/private/components/idle-guard";
import { LockedPlaceholder } from "@/features/private/components/locked-placeholder";
import { PinModal } from "@/features/private/components/pin-modal";
import { t } from "@/lib/i18n";
import { requireUser } from "@/server/auth/session";
import { readPrivateGate } from "@/server/private/gate";
import { getPrivateExpiry } from "@/server/private/guard";
import { getLockoutCountdown } from "@/server/private/lockout";

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

  const gate = await readPrivateGate(user.id);
  if (!gate) {
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
    const countdown = gate.lockedUntil && getLockoutCountdown(gate.lockedUntil);
    const initialLockout: PinLockout | undefined =
      countdown && countdown.secondsLeft > 0
        ? { status: "error", code: "LOCKED", ...countdown }
        : undefined;
    return (
      <PageFrame>
        {header}
        <LockedPlaceholder />
        <PinModal
          key={countdown?.lockedUntil}
          mode="unlock"
          action={unlockPrivateAction}
          initialLockout={initialLockout}
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      {header}
      <IdleGuard expiresAt={expiresAt} />
    </PageFrame>
  );
}
