"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BLOCK_CATEGORIES, categoryLabelKey } from "@/domain/categories";
import type { Category } from "@/domain/scoring/types";
import { MiniMonth } from "@/features/daily-tracker/calendar/mini-month";
import { t } from "@/lib/i18n";
import styles from "./control-rail-drawer.module.css";

export function ControlRailDrawer({
  selectedDate,
  todayIso,
  onSelectDate,
  activeCategories,
  onToggleCategory,
  dayStatus,
}: {
  readonly selectedDate: string;
  readonly todayIso: string;
  readonly onSelectDate: (date: string) => void;
  readonly activeCategories: ReadonlySet<Category>;
  readonly onToggleCategory: (category: Category) => void;
  readonly dayStatus: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogId = useId();
  const titleId = useId();

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 64rem)");
    const closeOnDesktop = () => {
      if (desktop.matches && dialog.current?.open) dialog.current.close();
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <>
      <Button
        variant="secondary"
        icon={SlidersHorizontal}
        aria-label={t("dailyTracker.controls.open")}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        className="size-11 shrink-0 p-0 lg:hidden"
        onClick={() => dialog.current?.showModal()}
      />
      <dialog
        ref={dialog}
        id={dialogId}
        aria-labelledby={titleId}
        className={`${styles.sheet} text-ink fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] w-full max-w-none overflow-auto overscroll-contain rounded-t-[28px] border border-(--border-subtle) bg-(--bg-surface) shadow-(--shadow-card) lg:hidden`}
      >
        <div className="mx-auto max-w-lg space-y-4 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <header className="flex items-center justify-between gap-4">
            <h2 id={titleId} className="text-base font-semibold">
              {t("dailyTracker.controls.title")}
            </h2>
            <Button
              variant="ghost"
              icon={X}
              aria-label={t("dailyTracker.controls.close")}
              className="size-11 shrink-0 p-0"
              onClick={() => dialog.current?.close()}
            />
          </header>
          <MiniMonth
            selectedDate={selectedDate}
            todayIso={todayIso}
            onSelect={(date) => {
              dialog.current?.close();
              onSelectDate(date);
            }}
          />
          {dayStatus}
          <fieldset className="min-w-0">
            <legend className="text-ink-muted mb-1 text-xs font-medium tracking-wide uppercase">
              {t("dailyTracker.filter.label")}
            </legend>
            <div className="grid grid-cols-2 gap-x-3">
              {BLOCK_CATEGORIES.map((category) => (
                <label
                  key={category}
                  className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={activeCategories.has(category)}
                    onChange={() => onToggleCategory(category)}
                    className="accent-accent focus-visible:outline-accent size-4 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2"
                  />
                  {t(categoryLabelKey(category))}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </dialog>
    </>
  );
}
