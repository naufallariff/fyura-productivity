"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { touchPrivateAction } from "@/app/actions/private";

const PING_INTERVAL_MS = 60_000;

/**
 * Extends the private session while the user is active.
 * Refreshes server data on success, and sends the user to unlock on failure.
 */
export function IdleGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const lastPing = useRef(0);

  useEffect(() => {
    const ping = () => {
      const now = Date.now();
      if (now - lastPing.current < PING_INTERVAL_MS) return;
      lastPing.current = now;

      void touchPrivateAction().then((ok) => {
        if (ok) router.refresh();
        else router.replace("/private");
      });
    };

    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((name) => window.addEventListener(name, ping, { passive: true }));
    return () => events.forEach((name) => window.removeEventListener(name, ping));
  }, [router]);

  return <>{children}</>;
}
