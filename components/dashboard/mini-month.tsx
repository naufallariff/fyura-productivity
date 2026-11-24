"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { monthCells, shiftMonth } from "@/domain/time/mini-month";
import { DEFAULT_LOCALE, t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const MONTH_FORMAT = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const DATE_FORMAT = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
  dateStyle: "full",
  timeZone: "UTC",
});

export function MiniMonth({
  today,
  recordedDates,
}: {
  readonly today: string;
  readonly recordedDates: readonly string[];
}) {
  const [offset, setOffset] = useState(0);
  const month = shiftMonth(today.slice(0, 7), offset);
  const cells = monthCells(Number(month.slice(0, 4)), Number(month.slice(5, 7)));
  const recorded = new Set(recordedDates);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p aria-live="polite" className="text-sm font-medium">
          {MONTH_FORMAT.format(new Date(`${month}-01T00:00:00Z`))}
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            icon={ChevronLeft}
            aria-label={t("dailyTracker.mini.previousMonth")}
            className="size-11 p-0"
            disabled={month === "0100-01"}
            onClick={() => setOffset((current) => current - 1)}
          />
          <Button
            variant="ghost"
            icon={ChevronRight}
            aria-label={t("dailyTracker.mini.nextMonth")}
            className="size-11 p-0"
            disabled={month === "9999-12"}
            onClick={() => setOffset((current) => current + 1)}
          />
        </div>
      </div>
      <div className="text-ink-muted grid grid-cols-7 text-center text-xs">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-1">
            {t(`dailyTracker.mini.${day}`)}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, index) => {
          if (date === null) return <span key={`empty-${index}`} />;

          const label = DATE_FORMAT.format(new Date(`${date}T00:00:00Z`));
          const hasActivity = recorded.has(date);
          return (
            <Link
              key={date}
              href={{ pathname: "/daily-tracker", query: { date } }}
              prefetch={false}
              aria-label={
                hasActivity ? t("dashboard.calendar.recordedDate", { date: label }) : label
              }
              aria-current={date === today ? "date" : undefined}
              className={cn(
                "hover:bg-accent-soft relative grid min-h-11 place-items-center rounded-lg text-xs tabular-nums",
                date === today &&
                  "bg-accent-soft text-ink ring-accent font-semibold ring-1 ring-inset",
              )}
            >
              {Number(date.slice(8, 10))}
              {hasActivity && (
                <span aria-hidden className="bg-accent absolute bottom-2 size-1 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
      <p className="text-ink-muted flex items-center gap-2 text-xs">
        <span aria-hidden className="bg-accent size-1 rounded-full" />
        {t("dashboard.calendar.legend")}
      </p>
    </div>
  );
}
