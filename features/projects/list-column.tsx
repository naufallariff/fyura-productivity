// features/projects/list-column.tsx
"use client";

import { useId, useState, type FormEvent } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";
import { CardItem } from "./card-item";
import type { DragData } from "./drag-types";
import { errorText, failureCode } from "./format";
import type { Label, List } from "./schemas";
import { useCreateCard, useListCards, type CardFilters } from "./use-projects";

export function ListColumn({
  userId,
  list,
  labels,
  filters,
  dragEnabled,
  onOpenCard,
  onEditList,
}: {
  userId: string;
  list: List;
  labels: readonly Label[];
  filters: CardFilters;
  dragEnabled: boolean;
  onOpenCard: (cardId: string) => void;
  onEditList: (list: List) => void;
}) {
  const cards = useListCards(userId, list.id, filters);
  const items = cards.data?.pages.flatMap((page) => page.items) ?? [];
  const ids = items.map((card) => card.id);

  const column = useSortable({
    id: `column:${list.id}`,
    data: { type: "column", listId: list.id, cardIds: ids } satisfies DragData,
  });

  const drop = useDroppable({
    id: `list:${list.id}`,
    data: { type: "list", listId: list.id, cardIds: ids } satisfies DragData,
  });

  return (
    <section
      ref={column.setNodeRef}
      style={{ transform: CSS.Transform.toString(column.transform), transition: column.transition }}
      aria-labelledby={`list-title-${list.id}`}
      className={cn(
        "flex max-h-[calc(100dvh-16rem)] w-72 shrink-0 snap-start flex-col gap-3 rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-3 shadow-(--shadow-card) sm:w-80",
        column.isDragging && "opacity-70",
      )}
    >
      <header className="flex items-center gap-1">
        <button
          ref={column.setActivatorNodeRef}
          type="button"
          {...column.attributes}
          {...column.listeners}
          aria-label={t("projects.list.move", { title: list.title })}
          className="text-ink-muted hover:bg-accent-soft focus-visible:ring-accent grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-lg focus-visible:ring-2"
        >
          <GripVertical aria-hidden className="size-4" strokeWidth={1.75} />
        </button>
        <h2
          id={`list-title-${list.id}`}
          className="min-w-0 flex-1 truncate px-1 text-sm font-semibold"
        >
          {list.title}
        </h2>
        <span className="text-ink-muted text-xs tabular-nums">{items.length}</span>
        <Button
          variant="ghost"
          size="sm"
          icon={Pencil}
          aria-label={t("projects.list.edit", { title: list.title })}
          className="size-8 p-0"
          onClick={() => onEditList(list)}
        />
      </header>

      <div
        ref={drop.setNodeRef}
        className={cn(
          "flex min-h-20 flex-1 flex-col gap-2 overflow-y-auto rounded-lg p-1",
          drop.isOver && "bg-accent-soft/40",
        )}
      >
        {cards.isPending && <Skeleton className="h-16" />}

        {cards.isError && (
          <div className="space-y-2">
            <p role="alert" className="text-negative text-sm">
              {t("projects.list.loadError")}
            </p>
            <Button variant="secondary" size="sm" onClick={() => cards.refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        )}

        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2">
            {items.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                listId={list.id}
                cardIds={ids}
                labels={labels}
                dragEnabled={dragEnabled}
                onOpen={() => onOpenCard(card.id)}
              />
            ))}
          </ul>
        </SortableContext>

        {cards.isSuccess && items.length === 0 && (
          <p className="text-ink-muted px-1 py-2 text-xs">{t("projects.list.empty")}</p>
        )}

        {cards.hasNextPage && (
          <Button
            variant="ghost"
            size="sm"
            pending={cards.isFetchingNextPage}
            onClick={() => cards.fetchNextPage()}
          >
            {t("projects.list.loadMore")}
          </Button>
        )}
      </div>

      <AddCard userId={userId} listId={list.id} />
    </section>
  );
}

function AddCard({ userId, listId }: { userId: string; listId: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="ghost" size="sm" icon={Plus} onClick={() => setOpen(true)}>
        {t("projects.card.add")}
      </Button>
    );
  }

  return <AddCardForm userId={userId} listId={listId} onCancel={() => setOpen(false)} />;
}

export function AddCardForm({
  userId,
  listId,
  onCancel,
  onCreated,
}: {
  userId: string;
  listId: string;
  onCancel: () => void;
  onCreated?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const create = useCreateCard(userId);
  const fieldId = useId();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = title.trim();
    if (value === "") return;
    setError(null);
    try {
      // No neighbours: the server appends the card at the end of the whole list,
      // including cards that are not loaded yet.
      await create.mutateAsync({ listId, title: value, beforeId: null, afterId: null });
      setTitle("");
      onCreated?.();
    } catch (failure) {
      setError(errorText(failureCode(failure)));
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <Field id={fieldId} label={t("projects.card.titleLabel")}>
        <Input
          id={fieldId}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          required
          autoFocus
          invalid={error !== null}
        />
      </Field>
      {error && (
        <p role="alert" className="text-negative text-xs">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" pending={create.isPending}>
          {t("projects.card.add")}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
