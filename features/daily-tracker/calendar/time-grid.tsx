"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { minuteOfDayIn } from "@/domain/focus/session";
import { formatMinute } from "@/domain/time/clock";
import { layoutLanes } from "@/domain/time/layout";
import { clamp, SNAP_MINUTES, snapMinute } from "@/domain/time/snap";
import type { Category } from "@/domain/scoring/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";
import { hueSoftVar, hueVar } from "@/lib/ui/hue";
import { CATEGORY_HUE } from "../category-hue";
import type { CalendarBlock } from "../use-daily-data";

export const HOUR_PX = 56;
const PX_PER_MIN = HOUR_PX / 60;
const DAY_MINUTES = 1440;
const MIN_LENGTH = SNAP_MINUTES;
const GUTTER_PX = 56;
const COLUMN_MIN_PX = 120;
const DEFAULT_SCROLL_HOUR = 7;
const EMPTY: readonly CalendarBlock[] = [];

interface Range {
  readonly start: number;
  readonly end: number;
}

type Gesture =
  | { kind: "create"; anchor: number; next: Range }
  | {
      kind: "move" | "resize";
      id: string;
      pointerY: number;
      origin: Range;
      next: Range;
      moved: boolean;
      editable: boolean;
    };

export interface TimeGridProps {
  readonly days: readonly string[];
  readonly blocks: readonly CalendarBlock[];
  readonly today: string;
  readonly timeZone: string;
  readonly blockDialogOpen?: boolean;
  /** Empty set shows every category. A non-empty set dims the rest. */
  readonly activeCategories: ReadonlySet<Category>;
  readonly onCreate: (logDate: string, startMinute: number, durationMinutes: number) => void;
  readonly onOpen: (block: CalendarBlock) => void;
  readonly onMove: (block: CalendarBlock, startMinute: number, endMinute: number) => void;
}

function subscribeClock(onChange: () => void): () => void {
  const id = window.setInterval(onChange, 30_000);
  return () => window.clearInterval(id);
}

/** Minute of day in the tracker's time zone. Null on the server, so the line appears after hydration. */
function useNowMinute(timeZone: string): number | null {
  return useSyncExternalStore<number | null>(
    subscribeClock,
    () => minuteOfDayIn(new Date(), timeZone),
    () => null,
  );
}

function groupByDay(blocks: readonly CalendarBlock[]): Map<string, CalendarBlock[]> {
  const map = new Map<string, CalendarBlock[]>();
  for (const block of blocks) {
    const bucket = map.get(block.logDate) ?? [];
    bucket.push(block);
    map.set(block.logDate, bucket);
  }
  return map;
}

export function TimeGrid(props: TimeGridProps) {
  const {
    days,
    blocks,
    today,
    timeZone,
    blockDialogOpen,
    activeCategories,
    onCreate,
    onOpen,
    onMove,
  } = props;
  const scroller = useRef<HTMLDivElement>(null);
  const nowMinute = useNowMinute(timeZone);
  const byDay = useMemo(() => groupByDay(blocks), [blocks]);
  const template = `${GUTTER_PX}px repeat(${days.length}, minmax(${COLUMN_MIN_PX}px, 1fr))`;

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = DEFAULT_SCROLL_HOUR * HOUR_PX;
  }, []);

  return (
    <div
      ref={scroller}
      role="region"
      aria-label={t("dailyTracker.grid.label")}
      tabIndex={0}
      className="max-h-[70vh] overflow-auto overscroll-contain rounded-2xl"
    >
      <div className="relative" style={{ minWidth: GUTTER_PX + days.length * COLUMN_MIN_PX }}>
        <div
          data-glass-permitted={blockDialogOpen ? undefined : true}
          className={cn(
            "border-line sticky top-0 z-20 grid border-b bg-(--bg-surface)",
            !blockDialogOpen && "glass",
          )}
          style={{ gridTemplateColumns: template }}
        >
          <span aria-hidden />
          {days.map((day) => (
            <DayHeader key={day} logDate={day} isToday={day === today} />
          ))}
        </div>

        <div className="grid" style={{ gridTemplateColumns: template, height: 24 * HOUR_PX }}>
          <HourGutter />
          {days.map((day) => (
            <DayColumn
              key={day}
              logDate={day}
              blocks={byDay.get(day) ?? EMPTY}
              isToday={day === today}
              nowMinute={nowMinute}
              activeCategories={activeCategories}
              onCreate={onCreate}
              onOpen={onOpen}
              onMove={onMove}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayHeader({ logDate, isToday }: { logDate: string; isToday: boolean }) {
  const date = new Date(`${logDate}T00:00:00Z`);
  const weekday = new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(date);
  const dayNumber = new Intl.DateTimeFormat("en", { day: "numeric", timeZone: "UTC" }).format(date);

  return (
    <div className="py-2 text-center">
      <p className="text-ink-muted text-xs font-medium tracking-wide uppercase">{weekday}</p>
      <p
        className={cn(
          "mx-auto mt-0.5 grid size-8 place-items-center rounded-full text-sm font-semibold",
          isToday ? "bg-accent text-on-accent" : "text-ink",
        )}
      >
        {dayNumber}
      </p>
    </div>
  );
}

function HourGutter() {
  return (
    <div className="relative">
      {Array.from({ length: 24 }, (_, hour) => (
        <span
          key={hour}
          className="text-ink-muted absolute right-2 -translate-y-1/2 text-[11px] tabular-nums"
          style={{ top: hour * HOUR_PX }}
        >
          {formatMinute(hour * 60)}
        </span>
      ))}
    </div>
  );
}

interface DayColumnProps {
  readonly logDate: string;
  readonly blocks: readonly CalendarBlock[];
  readonly isToday: boolean;
  readonly nowMinute: number | null;
  readonly activeCategories: ReadonlySet<Category>;
  readonly onCreate: TimeGridProps["onCreate"];
  readonly onOpen: TimeGridProps["onOpen"];
  readonly onMove: TimeGridProps["onMove"];
}

function DayColumn({
  logDate,
  blocks,
  isToday,
  nowMinute,
  activeCategories,
  onCreate,
  onOpen,
  onMove,
}: DayColumnProps) {
  const node = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const [items, setItems] = useState<readonly CalendarBlock[]>(blocks);
  const [source, setSource] = useState<readonly CalendarBlock[]>(blocks);
  const [draft, setDraft] = useState<Range | null>(null);

  // When the server data changes, the local copy is replaced. This runs during render,
  // which is the React pattern for resetting state from a prop.
  if (source !== blocks) {
    setSource(blocks);
    setItems(blocks);
  }

  const lanes = useMemo(() => {
    const laid = layoutLanes(
      items.map((block) => ({ id: block.id, start: block.startMinute, end: block.endMinute })),
    );
    return new Map(laid.map((entry) => [entry.id, entry]));
  }, [items]);

  const minuteAt = (clientY: number): number => {
    const rect = node.current?.getBoundingClientRect();
    return rect ? (clientY - rect.top) / PX_PER_MIN : 0;
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !node.current) return;
    node.current.setPointerCapture(event.pointerId);

    const target = event.target as HTMLElement;
    const blockEl = target.closest<HTMLElement>("[data-block-id]");

    if (blockEl) {
      const block = items.find((item) => item.id === blockEl.dataset.blockId);
      if (!block) return;
      const origin = { start: block.startMinute, end: block.endMinute };
      const editable = block.splitGroupId === null;
      gesture.current = {
        kind: editable && target.dataset.handle === "resize" ? "resize" : "move",
        id: block.id,
        pointerY: event.clientY,
        origin,
        next: origin,
        moved: false,
        editable,
      };
      return;
    }

    const anchor = clamp(snapMinute(minuteAt(event.clientY)), 0, DAY_MINUTES - MIN_LENGTH);
    const next = { start: anchor, end: anchor + MIN_LENGTH };
    gesture.current = { kind: "create", anchor, next };
    setDraft(next);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = gesture.current;
    if (!current) return;

    if (current.kind === "create") {
      const pointer = clamp(snapMinute(minuteAt(event.clientY)), 0, DAY_MINUTES);
      const start = clamp(Math.min(current.anchor, pointer), 0, DAY_MINUTES - MIN_LENGTH);
      const end = clamp(Math.max(current.anchor, pointer), start + MIN_LENGTH, DAY_MINUTES);
      current.next = { start, end };
      setDraft(current.next);
      return;
    }

    if (!current.editable) return;

    const delta = snapMinute((event.clientY - current.pointerY) / PX_PER_MIN);
    if (delta === 0 && !current.moved) return;

    const length = current.origin.end - current.origin.start;
    if (current.kind === "move") {
      const start = clamp(current.origin.start + delta, 0, DAY_MINUTES - length);
      current.next = { start, end: start + length };
    } else {
      const end = clamp(current.origin.end + delta, current.origin.start + MIN_LENGTH, DAY_MINUTES);
      current.next = { start: current.origin.start, end };
    }
    current.moved = true;

    const { id, next } = current;
    setItems((previous) =>
      previous.map((block) =>
        block.id === id ? { ...block, startMinute: next.start, endMinute: next.end } : block,
      ),
    );
  };

  const onPointerUp = () => {
    const current = gesture.current;
    gesture.current = null;
    if (!current) return;

    if (current.kind === "create") {
      setDraft(null);
      const length = current.next.end - current.next.start;
      if (length >= MIN_LENGTH) onCreate(logDate, current.next.start, length);
      return;
    }

    const block = blocks.find((item) => item.id === current.id);
    if (!block) return;

    // A press without movement opens the block for editing.
    if (!current.moved || !current.editable) {
      onOpen(block);
      return;
    }

    const unchanged =
      current.next.start === current.origin.start && current.next.end === current.origin.end;
    if (!unchanged) onMove(block, current.next.start, current.next.end);
  };

  const onPointerCancel = () => {
    gesture.current = null;
    setDraft(null);
    setItems(blocks);
  };

  return (
    <div
      ref={node}
      className="border-line relative border-l select-none"
      style={{ height: 24 * HOUR_PX, touchAction: "manipulation" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {Array.from({ length: 24 }, (_, hour) => (
        <div
          key={hour}
          aria-hidden
          className="border-line pointer-events-none absolute inset-x-0 border-t"
          style={{ top: hour * HOUR_PX }}
        />
      ))}

      {isToday && nowMinute !== null && (
        <div
          aria-hidden
          className="bg-negative pointer-events-none absolute inset-x-0 z-10 h-0.5"
          style={{ top: nowMinute * PX_PER_MIN }}
        >
          <span className="bg-negative absolute -top-1 -left-1 size-2.5 rounded-full" />
        </div>
      )}

      {draft && (
        <div
          aria-hidden
          className="border-accent bg-accent-soft/60 pointer-events-none absolute inset-x-1 rounded-lg border-2 border-dashed"
          style={{
            top: draft.start * PX_PER_MIN,
            height: (draft.end - draft.start) * PX_PER_MIN,
          }}
        />
      )}

      {items.map((block) => {
        const placed = lanes.get(block.id);
        return (
          <BlockCard
            key={block.id}
            block={block}
            lane={placed?.lane ?? 0}
            lanes={placed?.lanes ?? 1}
            dimmed={activeCategories.size > 0 && !activeCategories.has(block.category)}
          />
        );
      })}
    </div>
  );
}

function BlockCard({
  block,
  lane,
  lanes,
  dimmed,
}: {
  readonly block: CalendarBlock;
  readonly lane: number;
  readonly lanes: number;
  readonly dimmed: boolean;
}) {
  const hue = CATEGORY_HUE[block.category];
  const color = hueVar(hue);
  const editable = block.splitGroupId === null;
  const top = block.startMinute * PX_PER_MIN;
  const height = Math.max((block.endMinute - block.startMinute) * PX_PER_MIN - 2, 22);

  return (
    <div
      data-block-id={block.id}
      className={cn(
        "text-ink absolute rounded-lg text-xs transition-opacity duration-200",
        dimmed && "opacity-30",
      )}
      style={{
        top: top + 1,
        height,
        left: `calc(${(lane / lanes) * 100}% + 3px)`,
        width: `calc(${100 / lanes}% - 6px)`,
        background: hueSoftVar(hue),
        borderLeft: `3px ${editable ? "solid" : "dashed"} ${color}`,
        cursor: editable ? "grab" : "pointer",
      }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-lg py-1 pr-2 pl-3">
        <p className="truncate font-semibold">{block.activity}</p>
        <p className="text-ink-muted truncate tabular-nums">
          {t("dailyTracker.range", {
            start: formatMinute(block.startMinute),
            end: formatMinute(block.endMinute),
          })}
        </p>
      </div>
      {editable && (
        <span
          data-handle="resize"
          aria-hidden
          className="absolute inset-x-0 bottom-0 z-1 h-0.5 cursor-s-resize touch-none before:absolute before:inset-x-0 before:-bottom-2 before:h-5 before:cursor-s-resize"
        >
          <span
            className="pointer-events-none mx-auto block h-full w-6 rounded-full"
            style={{ background: color }}
          />
        </span>
      )}
    </div>
  );
}
