// features/daily-tracker/pomodoro/timer.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useShellCommand } from "@/client/hooks/use-shell-command";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import {
  FOCUS_PRESETS,
  formatCountdown,
  isValidFocusMinutes,
  minuteOfDayIn,
  remainingMs,
  type FocusKind,
} from "@/domain/focus/session";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";
import type { FocusLogResult } from "@/server/services/focus";
import { logFocusAction } from "./actions";

type Phase = "idle" | "running" | "saving";
type Notice = "completed" | "blockConflict" | "stopped";

interface Run {
  readonly kind: FocusKind;
  readonly plannedMinutes: number;
  readonly startedAt: number;
  readonly endsAt: number;
}

const MS_PER_MINUTE = 60_000;

const NOTICE_KEY: Record<Notice, string> = {
  completed: "focus.notice.completed",
  blockConflict: "focus.notice.blockConflict",
  stopped: "focus.notice.stopped",
};

function noticeFor(
  kind: FocusKind,
  reason: "completed" | "stopped",
  result: FocusLogResult,
): Notice {
  if (reason === "stopped") return "stopped";
  if (kind === "DEEP" && result.completed && !result.blockCreated) return "blockConflict";
  return "completed";
}

export function FocusTimer({ logDate, timeZone }: { logDate: string; timeZone: string }) {
  const [input, setInput] = useState("25");
  const [kind, setKind] = useState<FocusKind>("DEEP");
  const [phase, setPhase] = useState<Phase>("idle");
  const [shownMs, setShownMs] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const run = useRef<Run | null>(null);

  const minutes = Number(input);
  const valid = isValidFocusMinutes(minutes);
  const inputError = input !== "" && !valid ? t("focus.customInvalid") : undefined;

  // Stable identity keeps the animation effect from restarting on every render.
  const save = useCallback(
    async (current: Run, endedAt: number, reason: "completed" | "stopped") => {
      setPhase("saving");
      setSaveError(null);
      try {
        const result = await logFocusAction({
          logDate,
          kind: current.kind,
          plannedMinutes: current.plannedMinutes,
          startedAt: new Date(current.startedAt).toISOString(),
          endedAt: new Date(endedAt).toISOString(),
          startMinute: minuteOfDayIn(new Date(current.startedAt), timeZone),
        });
        if (!result.ok) throw new Error(result.code);
        setNotice(noticeFor(current.kind, reason, result.data));
      } catch {
        setSaveError(t("focus.error.save"));
      } finally {
        setPhase("idle");
        setShownMs(0);
      }
    },
    [logDate, timeZone],
  );

  // One animation loop, active only while a session runs.
  useEffect(() => {
    if (phase !== "running") return;

    let frame = 0;
    const tick = () => {
      const current = run.current;
      if (!current) return;

      const left = remainingMs(current.endsAt, Date.now());
      setShownMs(left);

      if (left === 0) {
        run.current = null;
        // The planned end is recorded, not the frame time, so the duration is exact.
        void save(current, current.endsAt, "completed");
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, save]);

  // Clears the running session if the component unmounts.
  useEffect(() => {
    return () => {
      run.current = null;
    };
  }, []);

  const start = () => {
    if (!valid || phase !== "idle") return;
    const startedAt = Date.now();
    run.current = {
      kind,
      plannedMinutes: minutes,
      startedAt,
      endsAt: startedAt + minutes * MS_PER_MINUTE,
    };
    setNotice(null);
    setSaveError(null);
    setShownMs(minutes * MS_PER_MINUTE);
    setPhase("running");
  };

  useShellCommand("startFocus", () => {
    document.getElementById("focus-title")?.scrollIntoView({ block: "center" });
    start();
  });

  const stop = () => {
    const current = run.current;
    if (!current) return;
    run.current = null;
    void save(current, Date.now(), "stopped");
  };

  const presetOptions = FOCUS_PRESETS.map((preset) => ({
    value: String(preset),
    label: t("focus.minutes", { minutes: preset }),
  }));

  const kindOptions = [
    { value: "DEEP", label: t("focus.kind.deep") },
    { value: "LIGHT", label: t("focus.kind.light") },
  ] as const;

  const display = phase === "idle" ? (valid ? minutes * MS_PER_MINUTE : 0) : shownMs;

  return (
    <>
      {phase === "running" && (
        <div
          aria-hidden
          className="bg-canvas/75 fixed inset-0 z-40 motion-safe:transition-opacity"
        />
      )}

      <section
        aria-labelledby="focus-title"
        className="relative z-50 mx-auto flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-6 shadow-(--shadow-card) sm:p-8"
      >
        <h2 id="focus-title" className="text-ink-muted text-sm font-medium">
          {t("focus.title")}
        </h2>

        <p
          role="timer"
          className="text-ink text-[72px] leading-none font-semibold tracking-[-0.04em] tabular-nums"
        >
          {formatCountdown(display)}
        </p>

        {phase === "idle" && (
          <div className="grid w-full gap-6">
            <Segmented
              label={t("focus.duration")}
              options={presetOptions}
              value={input}
              onChange={setInput}
            />

            <Field
              id="focus-minutes"
              label={t("focus.custom")}
              hint={t("focus.customHint")}
              error={inputError}
            >
              <Input
                id="focus-minutes"
                type="number"
                inputMode="numeric"
                min={1}
                max={240}
                step={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                invalid={inputError !== undefined}
                aria-describedby={inputError ? "focus-minutes-error" : "focus-minutes-hint"}
              />
            </Field>

            <Segmented
              label={t("focus.kind")}
              options={kindOptions}
              value={kind}
              onChange={setKind}
            />

            <Button onClick={start} disabled={!valid} className="w-full">
              {t("focus.start")}
            </Button>
          </div>
        )}

        {phase === "running" && (
          <Button variant="secondary" onClick={stop}>
            {t("focus.stop")}
          </Button>
        )}

        {phase === "saving" && <Button pending>{t("common.saving")}</Button>}

        {notice && (
          <p role="status" className={cn("text-ink-muted text-center text-sm")}>
            {t(NOTICE_KEY[notice])}
          </p>
        )}

        {saveError && (
          <p role="alert" className="text-negative text-center text-sm">
            {saveError}
          </p>
        )}
      </section>
    </>
  );
}
