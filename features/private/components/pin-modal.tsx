"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { PinActionState, PinLockout } from "@/features/private/actions";
import { t } from "@/lib/i18n";
import { PinPad } from "./pin-pad";

type Props = {
  mode: "setup" | "unlock";
  action: (previous: PinActionState, formData: FormData) => Promise<PinActionState>;
  initialLockout?: PinLockout;
};

/**
 * Native dialog gives focus trapping and Escape handling for free.
 * Closing it without unlocking returns the user to the dashboard.
 */
export function PinModal({ mode, action, initialLockout }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="pin-title"
      onClose={() => router.replace("/dashboard")}
      data-glass-permitted
      className="pin-sheet glass text-ink m-auto w-[min(92vw,400px)] rounded-2xl px-8 pt-10 pb-8 backdrop:bg-black/40 max-sm:mx-auto max-sm:mt-auto max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-t-[28px] max-sm:rounded-b-none max-sm:pb-10"
    >
      <PinPad mode={mode} action={action} initialLockout={initialLockout} />

      <button
        type="button"
        onClick={() => ref.current?.close()}
        className="text-accent ease-spring mx-auto mt-7 block rounded-lg px-4 py-2 text-sm font-medium transition-transform duration-200 active:scale-[0.97]"
      >
        {t("privateSpace.pin.cancel")}
      </button>
    </dialog>
  );
}
