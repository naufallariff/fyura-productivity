"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { deleteBlockAction, moveBlockAction } from "@/app/actions/today";
import { categoryLabelKey, categoryStyle } from "@/lib/habits/categories";
import { t } from "@/lib/i18n";
import type { Category } from "@/lib/scoring/types";
import { formatMinute } from "@/lib/time/clock";
import { layoutLanes } from "@/lib/time/layout";
import { SNAP_MINUTES, clamp, snapMinute } from "@/lib/time/snap";

export const HOUR_PX = 56;
const PX_PER_MIN = HOUR_PX / 60;
const GUTTER_PX = 56;
const DAY = 1440;
const MIN_LENGTH = SNAP_MINUTES;
const DEFAULT_SCROLL_HOUR = 6;

export interface GridBlock {
  id: string;
  startMinute: number;
  endMinute: number;
  activity: string;
  category: Category;
  /** False for midnight-split segments, which are read-only in the grid. */
  editable: boolean;
}

interface Range {
  start: number;
  end: number;
}

type Gesture =
  | { kind: "move" | "resize"; id: string; pointerY: number; origin: Range; next: Range }
  | { kind: "create"; anchor: number; next: Range };

export function DayGrid({
  blocks,
  onCreate,
}: {
  blocks: GridBlock[];
  onCreate: (start: number, end: number) => void;
}) {
  // Optimistic copy of the blocks. Resets when the server sends fresh data.
  const [items, setItems] = useState(blocks);
  const [source, setSource] = useState(blocks);
  if (source !== blocks) {
    setSource(blocks);
    setItems(blocks);
  }

  const [createRange, setCreateRange] = useState<Range | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scroller = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const snapshot = useRef<GridBlock[]>(blocks);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = DEFAULT_SCROLL_HOUR * HOUR_PX;
  }, []);

  const lanes = useMemo(() => {
    const laid = layoutLanes(
      items.map((b) => ({ id: b.id, start: b.startMinute, end: b.endMinute })),
    );
    return new Map(laid.map((l) => [l.id, l]));
  }, [items]);

  const minuteAt = (clientY: number): number => {
    const rect = container.current?.getBoundingClientRect();
    return rect ? (clientY - rect.top) / PX_PER_MIN : 0;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-no-drag]")) return;
    const node = container.current;
    if (!node) return;

    node.setPointerCapture(e.pointerId);
    setError(null);
    snapshot.current = items;

    const blockNode = target.closest<HTMLElement>("[data-block-id]");
    if (blockNode) {
      const block = items.find((b) => b.id === blockNode.dataset.blockId);
      if (!block || !block.editable) return;
      const origin = { start: block.startMinute, end: block.endMinute };
      gesture.current = {
        kind: target.dataset.handle === "resize" ? "resize" : "move",
        id: block.id,
        pointerY: e.clientY,
        origin,
        next: origin,
      };
      return;
    }

    const anchor = clamp(snapMinute(minuteAt(e.clientY)), 0, DAY - MIN_LENGTH);
    const next = { start: anchor, end: anchor + MIN_LENGTH };
    gesture.current = { kind: "create", anchor, next };
    setCreateRange(next);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g) return;

    if (g.kind === "create") {
      const current = clamp(snapMinute(minuteAt(e.clientY)), 0, DAY);
      const start = clamp(Math.min(g.anchor, current), 0, DAY - MIN_LENGTH);
      const end = clamp(Math.max(g.anchor, current), start + MIN_LENGTH, DAY);
      g.next = { start, end };
      setCreateRange(g.next);
      return;
    }

    const deltaMin = snapMinute((e.clientY - g.pointerY) / PX_PER_MIN);
    const length = g.origin.end - g.origin.start;

    if (g.kind === "move") {
      const start = clamp(g.origin.start + deltaMin, 0, DAY - length);
      g.next = { start, end: start + length };
    } else {
      const end = clamp(g.origin.end + deltaMin, g.origin.start + MIN_LENGTH, DAY);
      g.next = { start: g.origin.start, end };
    }

    const { id, next } = g;
    setItems((prev) =>
      prev.map((b) => (b.id === id ? { ...b, startMinute: next.start, endMinute: next.end } : b)),
    );
  };

  const onPointerUp = () => {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return;

    if (g.kind === "create") {
      setCreateRange(null);
      if (g.next.end - g.next.start >= MIN_LENGTH) onCreate(g.next.start, g.next.end);
      return;
    }

    const changed = g.next.start !== g.origin.start || g.next.end !== g.origin.end;
    if (!changed) return;

    moveBlockAction(g.id, g.next.start, g.next.end)
      .then((result) => {
        if (result.status === "error") {
          setItems(snapshot.current);
          setError(result.message);
        }
      })
      .catch(() => {
        setItems(snapshot.current);
        setError(t("today.error.save"));
      });
  };

  const onPointerCancel = () => {
    gesture.current = null;
    setCreateRange(null);
    setItems(snapshot.current);
  };

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}

      <div
        ref={scroller}
        className="rounded-card relative h-[min(70vh,760px)] overflow-y-auto overscroll-contain"
      >
        <div
          ref={container}
          className="relative select-none"
          style={{ height: 24 * HOUR_PX, touchAction: "pan-y" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={hour}
              className="border-line/60 pointer-events-none absolute inset-x-0 border-t"
              style={{ top: hour * HOUR_PX }}
            >
              <span className="text-muted absolute -top-2 left-0 w-12 pr-2 text-right text-[11px] tabular-nums">
                {formatMinute(hour * 60)}
              </span>
            </div>
          ))}

          {createRange && (
            <div
              className="pointer-events-none absolute rounded-[10px] border-2 border-dashed border-[#6366F1] bg-[#6366F1]/10"
              style={{
                top: createRange.start * PX_PER_MIN,
                height: (createRange.end - createRange.start) * PX_PER_MIN,
                left: `calc(${GUTTER_PX}px + 4px)`,
                right: 8,
              }}
            />
          )}

          {items.map((block) => {
            const layout = lanes.get(block.id);
            const lane = layout?.lane ?? 0;
            const laneCount = layout?.lanes ?? 1;
            const color = categoryStyle(block.category).solid;
            const top = block.startMinute * PX_PER_MIN;
            const height = Math.max((block.endMinute - block.startMinute) * PX_PER_MIN - 2, 20);

            return (
              <div
                key={block.id}
                data-block-id={block.id}
                className="text-text absolute overflow-hidden rounded-[10px] py-1.5 pr-2 pl-3 text-xs shadow-sm"
                style={{
                  top: top + 1,
                  height,
                  left: `calc(${GUTTER_PX}px + (100% - ${GUTTER_PX}px) * ${lane} / ${laneCount} + 3px)`,
                  width: `calc((100% - ${GUTTER_PX}px) / ${laneCount} - 6px)`,
                  background: `${color}33`,
                  borderLeft: `3px ${block.editable ? "solid" : "dashed"} ${color}`,
                  cursor: block.editable ? "grab" : "default",
                }}
              >
                <p className="truncate font-semibold">{block.activity}</p>
                <p className="text-muted truncate tabular-nums">
                  {formatMinute(block.startMinute)} to {formatMinute(block.endMinute)} ·{" "}
                  {t(categoryLabelKey(block.category))}
                </p>

                {block.editable && (
                  <>
                    <span
                      data-block-id={block.id}
                      data-handle="resize"
                      className="absolute inset-x-0 bottom-0 h-2.5 cursor-ns-resize"
                      style={{ touchAction: "none" }}
                    />
                    <form
                      data-no-drag
                      action={deleteBlockAction}
                      className="absolute top-1 right-1"
                    >
                      <input type="hidden" name="blockId" value={block.id} />
                      <button
                        type="submit"
                        aria-label={t("today.timeline.delete")}
                        className="bg-surface/80 text-muted hover:text-danger grid size-6 place-items-center rounded-full transition-colors"
                      >
                        <X aria-hidden className="size-3.5" strokeWidth={2} />
                      </button>
                    </form>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
