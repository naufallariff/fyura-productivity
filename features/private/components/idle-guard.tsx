"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { lockPrivateAction, touchPrivateAction } from "@/features/private/actions";
import { t } from "@/lib/i18n";
import { LockedPlaceholder } from "./locked-placeholder";
import { PrivateRecords } from "./private-records";
import { SessionRing } from "./session-ring";

const PING_INTERVAL_MS = 60_000;

/**
 * Keeps decrypted records in the mounted workspace and removes them as soon as it locks.
 */
export function IdleGuard({ expiresAt }: { readonly expiresAt: number }) {
  const lastPing = useRef(0);
  const [renewedUntil, setRenewedUntil] = useState(expiresAt);
  const [ended, setEnded] = useState(false);

  const endSession = useCallback(() => {
    setEnded(true);
    window.location.replace("/private");
  }, []);

  useEffect(() => {
    if (ended) return;
    let active = true;
    const ping = () => {
      const now = Date.now();
      if (now - lastPing.current < PING_INTERVAL_MS) return;
      lastPing.current = now;

      void touchPrivateAction().then(
        (expiry) => {
          if (!active) return;
          if (expiry === null) endSession();
          else setRenewedUntil(expiry);
        },
        () => {
          if (active) endSession();
        },
      );
    };

    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((name) => window.addEventListener(name, ping, { passive: true }));
    return () => {
      active = false;
      events.forEach((name) => window.removeEventListener(name, ping));
    };
  }, [endSession, ended]);

  if (ended) return <LockedPlaceholder />;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-4 shadow-(--shadow-card)">
        <SessionRing expiresAt={Math.max(expiresAt, renewedUntil)} onExpired={endSession} />
        <form
          action={async () => {
            setEnded(true);
            await lockPrivateAction();
          }}
        >
          <Button type="submit" variant="secondary">
            {t("privateSpace.session.lock")}
          </Button>
        </form>
      </section>
      <PrivateRecords onLocked={endSession} />
    </div>
  );
}
