"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { monthCells, shiftMonth } from "@/domain/time/mini-month";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";

const WEEKDAY_KEYS = [
  "dailyTracker.mini.mon",
  "dailyTracker.mini.tue",
  "dailyTracker.mini.wed",
  "dailyTracker.mini.thu",
  "dailyTracker.mini.fri",
  "dailyTracker.mini.sat",
  "dailyTracker.mini.sun",
] as const;

function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

function fullDate(iso: string): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "full", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

export function MiniMonth({
  selectedDate,
  todayIso,
  onSelect,
}: {
  readonly selectedDate: string;
  readonly todayIso: string;
  readonly onSelect: (date: string) => void;
}) {
  const selectedMonth = selectedDate.slice(0, 7);

  // Browsing months does not change the selected date. Selecting a new month resets the browsing offset.
  const [view, setView] = useState({ base: selectedMonth, offset: 0 });
  if (view.base !== selectedMonth) setView({ base: selectedMonth, offset: 0 });

  const yearMonth = shiftMonth(selectedMonth, view.offset);
  const year = Number(yearMonth.slice(0, 4));
  const month = Number(yearMonth.slice(5, 7));
  const cells = monthCells(year, month);

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{monthLabel(year, month)}</h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={ChevronLeft}
            aria-label={t("dailyTracker.mini.previousMonth")}
            className="size-9 p-0"
            onClick={() => setView((current) => ({ ...current, offset: current.offset - 1 }))}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={ChevronRight}
            aria-label={t("dailyTracker.mini.nextMonth")}
            className="size-9 p-0"
            onClick={() => setView((current) => ({ ...current, offset: current.offset + 1 }))}
          />
        </div>
      </header>

      <div className="text-ink-muted grid grid-cols-7 text-center text-[11px]">
        {WEEKDAY_KEYS.map((key) => (
          <span key={key} className="py-1">
            {t(key)}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell, index) =>
          cell === null ? (
            <span key={`pad-${index}`} />
          ) : (
            <button
              key={cell}
              type="button"
              aria-label={fullDate(cell)}
              aria-pressed={cell === selectedDate}
              aria-current={cell === todayIso ? "date" : undefined}
              onClick={() => onSelect(cell)}
              className={cn(
                "focus-visible:ring-accent mx-auto grid size-8 place-items-center rounded-full text-xs tabular-nums transition-colors duration-150 focus-visible:ring-2",
                cell === selectedDate
                  ? "bg-accent text-on-accent"
                  : "text-ink hover:bg-accent-soft",
                cell === todayIso && cell !== selectedDate && "ring-accent ring-1",
              )}
            >
              {Number(cell.slice(8, 10))}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
