// features/projects/card-item.tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";
import type { DragData } from "./drag-types";
import { formatDueDate } from "./format";
import type { Card, Label } from "./schemas";

function dueHue(state: Card["dueState"]): "rose" | "amber" | "emerald" | undefined {
  if (state === "overdue") return "rose";
  if (state === "today") return "amber";
  if (state === "complete") return "emerald";
  return undefined;
}

/** Presentation only. Used inside a sortable item and inside the drag overlay. */
export function CardFace({ card, labels }: { card: Card; labels: readonly Label[] }) {
  const cardLabels = labels.filter((label) => card.labelIds.includes(label.id));

  return (
    <div className="min-w-0 flex-1 space-y-2">
      {cardLabels.length > 0 && (
        <span className="flex flex-wrap gap-1">
          {cardLabels.map((label) => (
            <Pill key={label.id} hue={label.hue}>
              {label.name}
            </Pill>
          ))}
        </span>
      )}
      <span
        className={cn(
          "block text-sm font-medium",
          card.dueComplete && card.dueOn !== null && "text-ink-muted",
        )}
      >
        {card.title}
      </span>
      <span className="flex flex-wrap gap-2">
        {card.dueOn !== null && (
          <>
            <Pill hue={dueHue(card.dueState)}>{formatDueDate(card.dueOn)}</Pill>
            <Pill hue={dueHue(card.dueState)}>{t(`projects.due.${card.dueState}`)}</Pill>
          </>
        )}
        {card.checklist.total > 0 && (
          <Pill>
            {t("projects.checklist.count", {
              done: card.checklist.done,
              total: card.checklist.total,
            })}
          </Pill>
        )}
      </span>
    </div>
  );
}

export function CardItem({
  card,
  listId,
  cardIds,
  labels,
  dragEnabled,
  onOpen,
}: {
  card: Card;
  listId: string;
  cardIds: readonly string[];
  labels: readonly Label[];
  dragEnabled: boolean;
  onOpen: () => void;
}) {
  const sortable = useSortable({
    id: card.id,
    data: { type: "card", listId, cardIds, card } satisfies DragData,
    disabled: !dragEnabled,
  });

  return (
    <li
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={cn(
        "border-line flex items-start gap-1 rounded-xl border bg-(--bg-surface-elevated) p-2",
        sortable.isDragging && "opacity-60 shadow-lg",
      )}
    >
      <button
        ref={sortable.setActivatorNodeRef}
        type="button"
        {...sortable.attributes}
        {...sortable.listeners}
        disabled={!dragEnabled}
        aria-label={t("projects.card.drag", { title: card.title })}
        className={cn(
          "text-ink-muted focus-visible:ring-accent grid size-8 shrink-0 place-items-center rounded-lg focus-visible:ring-2",
          dragEnabled ? "hover:bg-accent-soft cursor-grab touch-none" : "opacity-40",
        )}
      >
        <GripVertical aria-hidden className="size-4" strokeWidth={1.75} />
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="hover:bg-accent-soft/50 focus-visible:ring-accent flex min-w-0 flex-1 rounded-lg p-1 text-left focus-visible:ring-2"
      >
        <CardFace card={card} labels={labels} />
      </button>
    </li>
  );
}
