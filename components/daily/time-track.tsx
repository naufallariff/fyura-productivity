"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { layoutLanes } from "@/domain/time/layout";
import type { Category, TimeBlock } from "@/models/daily";
import { clock } from "@/utils/daily";

const hourHeight = 62;

export function TimeTrack({
  blocks,
  filter,
  onCreate,
  onEdit,
}: {
  blocks: TimeBlock[];
  filter: Category | "";
  onCreate: (start: number, end: number) => void;
  onEdit: (block: TimeBlock) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ pointer: number; from: number } | null>(null);
  const [draft, setDraft] = useState<{ start: number; end: number } | null>(null);
  const [touchDraw, setTouchDraw] = useState(false);

  useEffect(() => {
    if (viewport.current) viewport.current.scrollTop = 7 * hourHeight;
  }, []);

  function minute(event: PointerEvent<HTMLDivElement>) {
    const offset = event.clientY - event.currentTarget.getBoundingClientRect().top;
    return Math.min(1440, Math.max(0, Math.round((offset / hourHeight) * 4) * 15));
  }

  function range(from: number, to: number) {
    const start = Math.min(from, to, 1425);
    return { start, end: Math.max(start + 15, from, to) };
  }

  return (
    <>
      <div className="track-guide">
        <span>Local time · Asia/Jakarta</span>
        <button
          className="touch-draw"
          type="button"
          aria-pressed={touchDraw}
          onClick={() => setTouchDraw(!touchDraw)}
        >
          {touchDraw ? "Drawing on" : "Touch drawing"}
        </button>
      </div>
      <div className="track-viewport" ref={viewport}>
        <div className="track-chart" style={{ height: hourHeight * 24 }}>
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="hour-line" style={{ top: hour * hourHeight }}>
              <span>{clock(hour * 60)}</span>
            </div>
          ))}
          <div
            className="track-events"
            data-touch-draw={touchDraw}
            onPointerDown={(event) => {
              if (
                event.button !== 0 ||
                (event.pointerType === "touch" && !touchDraw) ||
                event.target !== event.currentTarget
              )
                return;
              gesture.current = { pointer: event.pointerId, from: minute(event) };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const current = gesture.current;
              if (current?.pointer === event.pointerId)
                setDraft(range(current.from, minute(event)));
            }}
            onPointerCancel={() => {
              gesture.current = null;
              setDraft(null);
            }}
            onLostPointerCapture={() => {
              gesture.current = null;
              setDraft(null);
            }}
            onPointerUp={(event) => {
              const current = gesture.current;
              gesture.current = null;
              setDraft(null);
              if (current?.pointer !== event.pointerId) return;
              const to = minute(event);
              if (to !== current.from) {
                const { start, end } = range(current.from, to);
                onCreate(start, end);
              }
            }}
          >
            {layoutLanes(blocks).map(({ id, start, end, lane, lanes }) => {
              const block = blocks.find((item) => item.id === id);
              if (!block) return null;
              return (
                <button
                  className="event"
                  key={id}
                  data-category={block.category}
                  data-dim={!!filter && filter !== block.category}
                  title={`${block.title} · ${block.category} · ${clock(start)}–${clock(end)}`}
                  style={{
                    top: (start / 1440) * 100 + "%",
                    height: ((end - start) / 1440) * 100 + "%",
                    left: (lane / lanes) * 100 + "%",
                    width: 100 / lanes + "%",
                  }}
                  onClick={() => onEdit(block)}
                >
                  <strong>{block.title}</strong>
                  <small>
                    {block.category} · {clock(start)}–{clock(end)}
                  </small>
                </button>
              );
            })}
            {draft && (
              <div
                className="draw-preview"
                style={{
                  top: (draft.start / 1440) * 100 + "%",
                  height: ((draft.end - draft.start) / 1440) * 100 + "%",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
