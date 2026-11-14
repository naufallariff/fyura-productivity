"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { PinActionState } from "@/app/actions/private";
import { PinPad } from "./pin-pad";

type Props = {
  mode: "setup" | "unlock";
  action: (previous: PinActionState, formData: FormData) => Promise<PinActionState>;
};

/**
 * Native dialog gives focus trapping and Escape handling for free.
 * Closing it without unlocking returns the user to the dashboard.
 * Desktop: centered card. Mobile: bottom sheet.
 */
export function PinModal({ mode, action }: Props) {
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
      className="pin-sheet elevated rounded-card border-line bg-surface text-text m-auto w-[min(92vw,400px)] border px-8 pt-10 pb-8 backdrop:bg-black/40 max-sm:mx-auto max-sm:mt-auto max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-t-[28px] max-sm:rounded-b-none max-sm:pb-10"
    >
      <PinPad mode={mode} action={action} />

      <button
        type="button"
        onClick={() => ref.current?.close()}
        className="rounded-control text-accent ease-spring mx-auto mt-7 block px-4 py-2 text-sm font-medium transition-transform duration-200 active:scale-[0.97]"
      >
        Cancel
      </button>
    </dialog>
  );
}
