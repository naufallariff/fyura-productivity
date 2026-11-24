"use client";

import { Delete } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";
import type { PinActionState } from "@/features/private/actions";
import { t } from "@/lib/i18n";

const PIN_LENGTH = 6;
const KEYPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;
type Key = (typeof KEYPAD)[number];
const INITIAL: PinActionState = { status: "idle" };

type Props = {
  mode: "setup" | "unlock";
  action: (previous: PinActionState, formData: FormData) => Promise<PinActionState>;
};

function messageFor(state: PinActionState): string {
  if (state.status !== "error") return "";
  switch (state.code) {
    case "FORMAT":
      return t("privateSpace.pin.format");
    case "ALREADY_SET":
      return t("privateSpace.pin.alreadySet");
    case "WRONG":
      return t("privateSpace.pin.attemptsLeft", { count: state.attemptsLeft ?? 0 });
    case "LOCKED":
      return t("privateSpace.pin.locked", { minutes: state.minutes ?? 1 });
    case "NO_PIN":
      return t("privateSpace.pin.noPin");
    default:
      return t("privateSpace.pin.generic");
  }
}

export function PinPad({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const [digits, setDigits] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [seen, setSeen] = useState<PinActionState>(INITIAL);
  const [, startTransition] = useTransition();

  // Derived during render: clear the entry and shake once for each new error.
  if (state !== seen) {
    setSeen(state);
    if (state.status === "error") {
      setDigits("");
      setShakeKey((n) => n + 1);
    }
  }

  const submit = (pin: string) => {
    const payload = new FormData();
    payload.set("pin", pin);
    startTransition(() => formAction(payload));
  };

  const press = (key: Key) => {
    if (pending || key === "") return;

    if (key === "back") {
      setDigits((current) => current.slice(0, -1));
      return;
    }
    if (digits.length >= PIN_LENGTH) return;

    const next = digits + key;
    setDigits(next);
    navigator.vibrate?.(8);
    if (next.length === PIN_LENGTH) submit(next);
  };

  // Re-registered on every render, so the handler always sees the current digits.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (/^\d$/.test(event.key)) press(event.key as Key);
      else if (event.key === "Backspace") press("back");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const message = pending ? t("privateSpace.pin.checking") : messageFor(state);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="space-y-2 text-center">
        <h2 id="pin-title" className="text-[22px] font-semibold tracking-[-0.02em]">
          {mode === "setup" ? t("privateSpace.setup.title") : t("privateSpace.unlock.title")}
        </h2>
        <p className="text-ink-muted mx-auto max-w-70 text-sm leading-relaxed">
          {mode === "setup" ? t("privateSpace.setup.body") : t("privateSpace.unlock.body")}
        </p>
      </div>

      <div
        key={shakeKey}
        role="status"
        aria-label={t("privateSpace.pin.entered", { count: digits.length, total: PIN_LENGTH })}
        className={`flex gap-4 ${shakeKey > 0 ? "animate-pin-shake" : ""}`}
      >
        {Array.from({ length: PIN_LENGTH }, (_, index) => (
          <span
            key={index}
            className={`border-accent ease-spring size-3.5 rounded-full border-2 transition-all duration-300 ${
              index < digits.length ? "bg-accent scale-110" : "scale-100 bg-transparent"
            }`}
          />
        ))}
      </div>

      <p role="alert" aria-live="polite" className="text-negative min-h-5 text-center text-sm">
        {message}
      </p>

      <div className="grid grid-cols-3 gap-4">
        {KEYPAD.map((key, index) =>
          key === "" ? (
            <span key={index} aria-hidden />
          ) : (
            <button
              key={index}
              type="button"
              onClick={() => press(key)}
              disabled={pending}
              aria-label={
                key === "back"
                  ? t("privateSpace.pin.delete")
                  : t("privateSpace.pin.digit", { digit: key })
              }
              className="bg-ink/5 text-ink ease-spring hover:bg-line grid size-16 place-items-center rounded-full text-2xl font-medium transition-all duration-200 active:scale-90 disabled:opacity-50 sm:size-18"
            >
              {key === "back" ? <Delete aria-hidden className="size-5" strokeWidth={1.75} /> : key}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
