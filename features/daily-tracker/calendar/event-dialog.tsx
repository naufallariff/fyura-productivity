"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addBlockAction, type ActionState } from "@/app/actions/today";
import { BLOCK_CATEGORIES, categoryLabelKey } from "@/lib/habits/categories";
import { QUICK_CHIPS, type QuickChip } from "@/lib/habits/quick";
import { t } from "@/lib/i18n";
import { formatMinute } from "@/lib/time/clock";

export interface Draft {
  start: number;
  end: number;
  /** Changes on every open, so the form resets to the new defaults. */
  nonce: number;
}

const INITIAL: ActionState = { status: "idle" };
const FIELD =
  "w-full rounded-control border border-line bg-surface-raised px-3 py-2.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function AddBlockSheet({
  logDate,
  draft,
  onClose,
}: {
  logDate: string;
  draft: Draft | null;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(addBlockAction, INITIAL);
  const [chip, setChip] = useState<QuickChip>(QUICK_CHIPS[0]);

  // Opening and closing the native dialog is a DOM side effect.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (draft && !el.open) el.showModal();
    if (!draft && el.open) el.close();
  }, [draft]);

  // A successful save closes the sheet. `onClose` must be stable (see workspace).
  useEffect(() => {
    if (state.status === "ok") onClose();
  }, [state, onClose]);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="add-block-title"
      className="pin-sheet elevated rounded-card border-line bg-surface text-text m-auto w-[min(92vw,460px)] border p-0 backdrop:bg-black/40 max-sm:mx-auto max-sm:mt-auto max-sm:mb-0 max-sm:w-full max-sm:rounded-t-[28px] max-sm:rounded-b-none"
    >
      {draft && (
        <form key={draft.nonce} action={formAction} className="space-y-5 p-6">
          <header className="space-y-1">
            <h2 id="add-block-title" className="text-lg font-semibold tracking-[-0.01em]">
              {t("today.sheet.title")}
            </h2>
            <p className="text-muted text-sm">{t("today.sheet.hint")}</p>
          </header>

          <fieldset className="space-y-2">
            <legend className="text-muted text-xs font-medium tracking-widest uppercase">
              {t("today.sheet.quick")}
            </legend>
            <div className="flex flex-wrap gap-2">
              {QUICK_CHIPS.map((option) => {
                const active = option.id === chip.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setChip(option)}
                    className={`rounded-full px-3.5 py-1.5 text-sm transition-colors duration-200 ${
                      active
                        ? "bg-accent text-on-accent"
                        : "bg-surface-raised text-text hover:bg-line"
                    }`}
                  >
                    {t(option.labelKey)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div key={chip.id} className="space-y-4">
            <input type="hidden" name="logDate" value={logDate} />
            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-1.5 text-sm">
                <span className="text-muted">{t("today.sheet.start")}</span>
                <input
                  type="time"
                  name="startTime"
                  defaultValue={formatMinute(draft.start)}
                  required
                  className={FIELD}
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-muted">{t("today.sheet.duration")}</span>
                <input
                  type="number"
                  name="durationMinutes"
                  min={1}
                  max={1440}
                  step={1}
                  defaultValue={draft.end - draft.start}
                  required
                  className={FIELD}
                />
              </label>
            </div>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t("today.sheet.activity")}</span>
              <input
                type="text"
                name="activity"
                defaultValue={t(chip.labelKey)}
                maxLength={120}
                required
                className={FIELD}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t("today.sheet.category")}</span>
              <select name="category" defaultValue={chip.category} className={FIELD}>
                {BLOCK_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {t(categoryLabelKey(category))}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {state.status === "error" && (
            <p role="alert" className="text-danger text-sm">
              {state.message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="rounded-control text-muted ease-spring px-4 py-2.5 text-sm font-medium transition-transform duration-200 active:scale-[0.97]"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-control bg-accent text-on-accent ease-spring px-5 py-2.5 text-sm font-medium transition-transform duration-200 active:scale-[0.97] disabled:opacity-60"
            >
              {pending ? t("common.saving") : t("today.sheet.submit")}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
