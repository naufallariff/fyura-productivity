"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TOTAL_MS = 10 * 60_000;
const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const pad = (n: number) => String(n).padStart(2, "0");

/** Countdown ring for the private session. Shows remaining time and locks at zero. */
export function SessionRing({ expiresAt }: { expiresAt: number }) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= expiresAt) {
        clearInterval(id);
        router.replace("/private");
      }
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt, router]);

  const remaining = now === null ? TOTAL_MS : Math.max(0, expiresAt - now);
  const fraction = Math.min(1, remaining / TOTAL_MS);
  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);

  return (
    <div
      className="relative grid size-16 place-items-center"
      role="timer"
      aria-label="Time left in private session"
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
      <span className="text-text text-xs font-medium tabular-nums">
        {now === null ? "--:--" : `${minutes}:${pad(seconds)}`}
      </span>
    </div>
  );
}
