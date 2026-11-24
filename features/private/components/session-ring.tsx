"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";

const TOTAL_MS = 10 * 60_000;
const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const pad = (n: number) => String(n).padStart(2, "0");

/** Countdown ring for the private session. Sends the user back to unlock at zero. */
export function SessionRing({
  expiresAt,
  onExpired,
}: {
  expiresAt: number;
  onExpired: () => void;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (current >= expiresAt) {
        clearInterval(id);
        onExpired();
      }
    };
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [expiresAt, onExpired]);

  const remaining = now === null ? TOTAL_MS : Math.max(0, expiresAt - now);
  const fraction = Math.min(1, remaining / TOTAL_MS);
  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);

  return (
    <div
      className="relative grid size-16 place-items-center"
      role="timer"
      aria-label={t("privateSpace.session.timer")}
    >
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={RADIUS} className="stroke-accent/15 fill-none" strokeWidth="4" />
        <circle
          cx="32"
          cy="32"
          r={RADIUS}
          className="stroke-accent fill-none transition-[stroke-dashoffset] duration-1000 ease-linear"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
        />
      </svg>
      <span className="text-ink text-xs font-medium tabular-nums">
        {now === null ? "--:--" : `${minutes}:${pad(seconds)}`}
      </span>
    </div>
  );
}
