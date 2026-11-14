"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { logFocusAction } from "@/app/actions/focus";
import {
  FOCUS_DURATIONS,
  formatCountdown,
  remainingMs,
  type FocusDuration,
  type FocusKind,
  minuteOfDayIn,
} from "@/lib/focus/session";
import { t } from "@/lib/i18n";

type Phase = "idle" | "running" | "saving";

interface Run {
  kind: FocusKind;
  plannedMinutes: FocusDuration;
  startedAt: number;
  endsAt: number;
}

export function FocusTimer({ logDate, timeZone }: { logDate: string; timeZone: string }) {
  const [duration, setDuration] = useState<FocusDuration>(25);
  const [kind, setKind] = useState<FocusKind>("DEEP");
  const [phase, setPhase] = useState<Phase>("idle");
  const [shownMs, setShownMs] = useState(duration * 60_000);
  const run = useRef<Run | null>(null);
  const [, startSaving] = useTransition();

  const [saveError, setSaveError] = useState<string | null>(null);

  const persist = (current: Run, endedAt: number) => {
    setPhase("saving");
    setSaveError(null);
    const startMinute = minuteOfDayIn(new Date(current.startedAt), timeZone);

    startSaving(() => {
      logFocusAction({
        logDate,
        kind: current.kind,
        plannedMinutes: current.plannedMinutes,
        startedAt: new Date(current.startedAt).toISOString(),
        endedAt: new Date(endedAt).toISOString(),
        startMinute,
      })
        .then(() => {
          setPhase("idle");
          setShownMs(duration * 60_000);
        })
        .catch(() => {
          setPhase("idle");
          setShownMs(duration * 60_000);
          setSaveError(t("focus.error.save"));
        });
    });
  };

  useEffect(() => {
    if (phase !== "running") return;

    let frame = 0;
    const tick = () => {
      const current = run.current;
      if (!current) return;
      const now = Date.now();
      const left = remainingMs(current.endsAt, now);
      setShownMs(left);

      if (left === 0) {
        run.current = null;
        persist(current, now);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== "running") return;
    document.body.dataset.focus = "on";
    return () => {
      delete document.body.dataset.focus;
    };
  }, [phase]);

  useEffect(() => {
    return () => {
      run.current = null;
    };
  }, []);

  const start = () => {
    const startedAt = Date.now();
    run.current = {
      kind,
      plannedMinutes: duration,
      startedAt,
      endsAt: startedAt + duration * 60_000,
    };
    setShownMs(duration * 60_000);
    setPhase("running");
  };

  const stopEarly = () => {
    const current = run.current;
    if (!current) return;
    run.current = null;
    persist(current, Date.now());
  };

  return (
    <section aria-labelledby="focus-title" className="text-center">
      <h2 id="focus-title" className="text-muted text-sm font-medium">
        {t("focus.title")}
      </h2>

      <p className="mt-4 text-[72px] leading-none font-semibold tracking-[-0.04em] tabular-nums">
        {formatCountdown(shownMs)}
      </p>

      {phase === "idle" && (
        <>
          <div
            role="radiogroup"
            aria-label={t("focus.duration")}
            className="mt-6 flex justify-center gap-2"
          >
            {FOCUS_DURATIONS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={duration === option}
                onClick={() => {
                  setDuration(option);
                  setShownMs(option * 60_000);
                }}
                className={`ease-spring rounded-full px-4 py-2 text-sm font-medium transition-transform duration-200 active:scale-[0.97] ${
                  duration === option ? "bg-accent text-on-accent" : "bg-surface-raised"
                }`}
              >
                {t("focus.minutes", { minutes: option })}
              </button>
            ))}
          </div>
          <div
            role="radiogroup"
            aria-label={t("focus.kind")}
            className="mt-3 flex justify-center gap-2"
          >
            {(["DEEP", "LIGHT"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={kind === option}
                onClick={() => setKind(option)}
                className={`ease-spring rounded-full px-4 py-2 text-sm font-medium transition-transform duration-200 active:scale-[0.97] ${
                  kind === option ? "bg-accent text-on-accent" : "bg-surface-raised"
                }`}
              >
                {t(option === "DEEP" ? "focus.kind.deep" : "focus.kind.light")}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={start}
            className="rounded-control bg-accent text-on-accent ease-spring mt-8 px-8 py-3 text-sm font-medium transition-transform duration-200 active:scale-[0.97]"
          >
            {t("focus.start")}
          </button>
        </>
      )}

      {phase === "running" && (
        <button
          type="button"
          onClick={stopEarly}
          className="rounded-control border-line ease-spring mt-8 border px-8 py-3 text-sm font-medium transition-transform duration-200 active:scale-[0.97]"
        >
          {t("focus.stop")}
        </button>
      )}
      {saveError && (
        <p role="alert" className="text-danger mt-6 text-sm">
          {saveError}
        </p>
      )}
    </section>
  );
}
