import { Suspense } from "react";
import { lockPrivateAction, setupPinAction, unlockPrivateAction } from "@/app/actions/private";
import { IdleGuard } from "@/components/private/idle-guard";
import { PinModal } from "@/components/private/pin-modal";
import { SessionRing } from "@/components/private/session-ring";
import { requireUser } from "@/lib/auth/session";
import { hasPrivatePin } from "@/lib/private/gate";
import { getPrivateExpiry } from "@/lib/private/guard";

function LockedPlaceholder() {
  return (
    <section className="elevated rounded-card border-line bg-surface border p-8 text-center">
      <div className="bg-surface-raised mx-auto grid size-12 place-items-center rounded-2xl text-xl">
        🔒
      </div>
      <h2 className="mt-4 text-lg font-semibold tracking-[-0.01em]">Private space is locked</h2>
      <p className="text-muted mt-1 text-sm">Enter your PIN to open it.</p>
    </section>
  );
}

function Unlocked({ expiresAt }: { expiresAt: number }) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-8 sm:py-12">
      <header className="elevated rounded-card border-line bg-surface flex items-center justify-between gap-4 border p-6">
        <div className="space-y-1">
          <p className="text-muted text-sm">Private space</p>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Unlocked</h1>
        </div>
        <div className="flex items-center gap-4">
          <SessionRing expiresAt={expiresAt} />
          <form action={lockPrivateAction}>
            <button
              type="submit"
              className="rounded-control border-line bg-surface-raised text-text ease-spring border px-4 py-2.5 text-sm font-medium transition-transform duration-200 active:scale-[0.97]"
            >
              Lock
            </button>
          </form>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {["Recovery log", "Private flame"].map((title) => (
          <article key={title} className="rounded-card border-line bg-surface border p-6">
            <p className="text-muted text-xs font-medium tracking-widest uppercase">
              Opens in Phase 4
            </p>
            <h2 className="mt-3 text-lg font-semibold tracking-[-0.01em]">{title}</h2>
          </article>
        ))}
      </section>
    </main>
  );
}

async function PrivateContent() {
  const user = await requireUser();
  const expiresAt = await getPrivateExpiry(user.id);

  if (expiresAt === null) {
    const hasPin = await hasPrivatePin(user.id);
    return (
      <main className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
        <LockedPlaceholder />
        <PinModal
          mode={hasPin ? "unlock" : "setup"}
          action={hasPin ? unlockPrivateAction : setupPinAction}
        />
      </main>
    );
  }

  return (
    <IdleGuard>
      <Unlocked expiresAt={expiresAt} />
    </IdleGuard>
  );
}

export default function PrivatePage() {
  return (
    <Suspense fallback={null}>
      <PrivateContent />
    </Suspense>
  );
}
