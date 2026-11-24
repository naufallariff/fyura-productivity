"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./button";

/**
 * Native dialog with focus trapping and Escape handling from the browser.
 * On phones it becomes a bottom sheet.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  closeLabel,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  closeLabel: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Syncing with the native dialog is a DOM side effect, which effects are for.
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      data-glass-permitted
      className="glass text-ink backdrop:bg-ink/30 m-auto w-[min(92vw,520px)] max-w-none rounded-2xl p-0 max-sm:mx-0 max-sm:mt-auto max-sm:mb-0 max-sm:w-full max-sm:rounded-t-[28px] max-sm:rounded-b-none"
    >
      <div className="flex items-start justify-between gap-4 p-4 pb-3 sm:p-6 sm:pb-3">
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg font-semibold tracking-[-0.01em]">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="text-ink-muted mt-1 text-sm">
              {description}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          aria-label={closeLabel}
          onClick={() => ref.current?.close()}
          className="size-10 shrink-0 p-0 sm:size-9"
        >
          <X aria-hidden className="size-4" strokeWidth={1.75} />
        </Button>
      </div>

      <div className="px-4 pb-4 sm:px-6 sm:pb-6">{children}</div>

      {footer && (
        <div className="border-line flex justify-end gap-2 border-t px-4 py-4 sm:px-6">
          {footer}
        </div>
      )}
    </dialog>
  );
}
