"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import type { PinActionState } from "@/app/actions/private";

const PIN_LENGTH = 6;
const KEYPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;
type Key = (typeof KEYPAD)[number];
const INITIAL: PinActionState = { status: "idle" };

type Props = {
  mode: "setup" | "unlock";
  action: (previous: PinActionState, formData: FormData) => Promise<PinActionState>;
};

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
      setDigits((d) => d.slice(0, -1));
      return;
    }
    if (digits.length >= PIN_LENGTH) return;

    const next = digits + key;
    setDigits(next);
    navigator.vibrate?.(8);
    if (next.length === PIN_LENGTH) submit(next);
  };

  // Keyboard input. Re-registered each render so it always sees the current digits.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (/^\d$/.test(event.key)) press(event.key as Key);
      else if (event.key === "Backspace") press("back");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const message = pending ? "Checking…" : state.status === "error" ? state.message : "";

  return (
    <div className="flex flex-col items-center gap-7">
      <div className="space-y-2 text-center">
        <h2 id="pin-title" className="text-[22px] font-semibold tracking-[-0.02em]">
          {mode === "setup" ? "Create your PIN" : "Enter your PIN"}
        </h2>
        <p className="text-muted mx-auto max-w-70 text-sm leading-relaxed">
          {mode === "setup"
            ? "Six digits, separate from your Google login. It cannot be recovered in this version."
            : "Six digits to open your private space."}
        </p>
      </div>

      <div
        key={shakeKey}
        role="status"
        aria-label={`${digits.length} of ${PIN_LENGTH} digits entered`}
        className={`flex gap-3.5 ${shakeKey > 0 ? "animate-pin-shake" : ""}`}
      >
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span
            key={i}
            className={`border-accent ease-spring size-3.5 rounded-full border-2 transition-all duration-300 ${
              i < digits.length ? "bg-accent scale-110" : "scale-100 bg-transparent"
            }`}
          />
        ))}
      </div>

      <p role="alert" aria-live="polite" className="text-danger min-h-5 text-center text-sm">
        {message}
      </p>

      <div className="grid grid-cols-3 gap-3.5 sm:gap-4">
        {KEYPAD.map((key, i) =>
          key === "" ? (
            <span key={i} aria-hidden />
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => press(key)}
              disabled={pending}
              aria-label={key === "back" ? "Delete digit" : `Digit ${key}`}
              className="bg-surface-raised text-text ease-spring hover:bg-line grid size-16 place-items-center rounded-full text-2xl font-medium transition-all duration-200 active:scale-90 disabled:opacity-50 sm:size-18"
            >
              {key === "back" ? "⌫" : key}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
