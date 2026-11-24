"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Segmented, type SegmentedOption } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { BLOCK_CATEGORIES, categoryLabelKey } from "@/domain/categories";
import type { Category } from "@/domain/scoring/types";
import { addDays } from "@/domain/time/logical-date";
import { weekOf } from "@/domain/time/week";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";
import { hueVar } from "@/lib/ui/hue";
import { ChecklistPanel } from "./checklist/checklist-panel";
import { MiniMonth } from "./calendar/mini-month";
import { BlockDialog, type BlockDraft } from "./calendar/block-dialog";
import { TimeGrid } from "./calendar/time-grid";
import { CATEGORY_HUE } from "./category-hue";
import { FocusTimer } from "./pomodoro/timer";
import { useCalendarBlocks, useMoveBlock, type CalendarBlock } from "./use-daily-data";

export type TrackerView = "day" | "week";

const VIEW_OPTIONS: SegmentedOption<TrackerView>[] = [
  { value: "day", label: t("dailyTracker.view.day") },
  { value: "week", label: t("dailyTracker.view.week") },
];

const DEFAULT_CREATE_START = 9 * 60;
const DEFAULT_CREATE_DURATION = 60;

function monthLabel(iso: string): string {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

export function DailyTrackerWorkspace({
  userId,
  logDate,
  view,
  today,
  timeZone,
}: {
  readonly userId: string;
  readonly logDate: string;
  readonly view: TrackerView;
  readonly today: string;
  readonly timeZone: string;
}) {
  const router = useRouter();
  const days = useMemo(() => (view === "week" ? weekOf(logDate) : [logDate]), [view, logDate]);
  const firstDay = days[0] ?? logDate;
  const lastDay = days[days.length - 1] ?? logDate;

  const blocks = useCalendarBlocks(userId, firstDay, lastDay);
  const move = useMoveBlock(userId);

  const [activeCategories, setActiveCategories] = useState<Set<Category>>(() => new Set());
  const [draft, setDraft] = useState<BlockDraft | null>(null);

  const step = view === "week" ? 7 : 1;

  const go = (date: string, nextView: TrackerView = view) => {
    router.push(`/daily-tracker?date=${date}&view=${nextView}`, { scroll: false });
  };

  const toggleCategory = (category: Category) => {
    setActiveCategories((previous) => {
      const next = new Set(previous);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const openCreate = (
    date: string,
    startMinute = DEFAULT_CREATE_START,
    durationMinutes = DEFAULT_CREATE_DURATION,
  ) => {
    setDraft({ mode: "create", logDate: date, startMinute, durationMinutes });
  };

  const openEdit = (block: CalendarBlock) => setDraft({ mode: "edit", block });

  const moveBlock = (block: CalendarBlock, startMinute: number, endMinute: number) => {
    move.mutate({ blockId: block.id, startMinute, endMinute });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)_20rem]">
        <aside className="hidden rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-4 shadow-(--shadow-card) lg:block lg:self-start">
          <MiniMonth selectedDate={logDate} todayIso={today} onSelect={(date) => go(date)} />
        </aside>

        <section className="min-w-0 space-y-4 rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-4 shadow-(--shadow-card)">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                icon={ChevronLeft}
                aria-label={t("dailyTracker.previous")}
                className="size-10 p-0"
                onClick={() => go(addDays(logDate, -step))}
              />
              <Button variant="secondary" size="sm" onClick={() => go(today)}>
                {t("dailyTracker.today")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={ChevronRight}
                aria-label={t("dailyTracker.next")}
                className="size-10 p-0"
                onClick={() => go(addDays(logDate, step))}
              />
              <p className="ml-2 text-sm font-semibold">{monthLabel(logDate)}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Segmented
                label={t("dailyTracker.view.label")}
                options={VIEW_OPTIONS}
                value={view}
                onChange={(next) => go(logDate, next)}
              />
              <Button icon={Plus} onClick={() => openCreate(logDate)}>
                {t("dailyTracker.addBlock")}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-ink-muted text-xs font-medium tracking-wide uppercase">
              {t("dailyTracker.filter.label")}
            </p>
            <div className="flex flex-wrap gap-2">
              {BLOCK_CATEGORIES.map((category) => {
                const active = activeCategories.has(category);
                return (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleCategory(category)}
                    className={cn(
                      "focus-visible:ring-accent inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors duration-150 focus-visible:ring-2",
                      active
                        ? "border-accent bg-accent-soft"
                        : "border-line text-ink-muted hover:text-ink",
                    )}
                  >
                    <span
                      aria-hidden
                      className="size-2 rounded-full"
                      style={{ background: hueVar(CATEGORY_HUE[category]) }}
                    />
                    {t(categoryLabelKey(category))}
                  </button>
                );
              })}
              {activeCategories.size > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setActiveCategories(new Set())}>
                  {t("dailyTracker.filter.clear")}
                </Button>
              )}
            </div>
          </div>

          {blocks.isPending && <Skeleton className="h-[60vh]" />}

          {blocks.isError && (
            <EmptyState
              icon={Plus}
              title={t("dailyTracker.loadError")}
              action={
                <Button variant="secondary" onClick={() => blocks.refetch()}>
                  {t("common.retry")}
                </Button>
              }
            />
          )}

          {blocks.data && (
            <TimeGrid
              days={days}
              blocks={blocks.data}
              todayIso={today}
              timeZone={timeZone}
              activeCategories={activeCategories}
              onCreate={(date, start, duration) => openCreate(date, start, duration)}
              onOpen={openEdit}
              onMove={moveBlock}
            />
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-4 shadow-(--shadow-card)">
            <ChecklistPanel userId={userId} logDate={logDate} />
          </div>
          <FocusTimer logDate={logDate} timeZone={timeZone} />
        </aside>
      </div>

      <section className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-4 shadow-(--shadow-card)">
        <HistoryPanelSlot userId={userId} />
      </section>

      <BlockDialog userId={userId} draft={draft} onClose={() => setDraft(null)} />
    </div>
  );
}

import { HistoryPanel as HistoryPanelSlot } from "./history/history-panel";
