// features/projects/list-column.tsx
"use client";

import { useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Ellipsis, GripVertical, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Textarea, describedBy } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";
import { CardItem } from "./card-item";
import type { DragData } from "./drag-types";
import { errorText, failureCode } from "./format";
import type { Label, List } from "./schemas";
import {
  useCreateCard,
  useListCards,
  useSortListByDueDate,
  type CardFilters,
} from "./use-projects";

export function ListColumn({
  userId,
  list,
  labels,
  filters,
  dragEnabled,
  onOpenCard,
  onEditList,
  onMoveList,
  onDeleteList,
}: {
  userId: string;
  list: List;
  labels: readonly Label[];
  filters: CardFilters;
  dragEnabled: boolean;
  onOpenCard: (cardId: string) => void;
  onEditList: (list: List) => void;
  onMoveList: (list: List) => void;
  onDeleteList: (list: List) => void;
}) {
  const cards = useListCards(userId, list.id, filters);
  const items = cards.data?.pages.flatMap((page) => page.items) ?? [];
  const ids = items.map((card) => card.id);
  const sort = useSortListByDueDate(userId, list.id);
  const [composerOpen, setComposerOpen] = useState(false);
  const addCardButton = useRef<HTMLButtonElement>(null);
  const composer = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const focusComposer = () => {
    if (composerOpen) composer.current?.querySelector("textarea")?.focus();
    else setComposerOpen(true);
  };

  const closeComposer = () => {
    setComposerOpen(false);
    requestAnimationFrame(() => addCardButton.current?.focus());
  };

  const menuActions = [
    { label: t("projects.card.add"), run: focusComposer },
    { label: t("projects.list.sortByDueDate"), run: () => sort.mutate(), disabled: sort.isPending },
    { label: t("projects.list.moveAction"), run: () => onMoveList(list) },
    { label: t("projects.list.delete"), run: () => onDeleteList(list), danger: true },
  ];

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
          className="text-ink-muted hover:bg-accent-soft focus-visible:ring-accent grid size-8 shrink-0 cursor-grab place-items-center rounded-lg focus-visible:ring-2"
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
        <Button
          variant="ghost"
          icon={Ellipsis}
          aria-label={t("projects.list.actions", { title: list.title })}
          aria-haspopup="menu"
          popoverTarget={menuId}
          className="min-h-11 min-w-11 p-0"
          onKeyDown={(event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            event.preventDefault();
            if (!menu.current?.matches(":popover-open")) event.currentTarget.click();
            const items =
              menu.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
            if (items) items[event.key === "ArrowDown" ? 0 : items.length - 1]?.focus();
          }}
        />
        <div
          id={menuId}
          ref={menu}
          popover="auto"
          role="menu"
          aria-label={t("projects.list.actions", { title: list.title })}
          className="text-ink fixed inset-auto m-0 w-52 rounded-xl border border-(--border-subtle) bg-(--bg-surface-elevated) p-1 shadow-(--shadow-raised) [position-area:bottom_span-left] [position-try-fallbacks:flip-block,flip-inline]"
          onKeyDown={(event) => {
            if (event.key === "Tab") {
              event.currentTarget.hidePopover();
              return;
            }
            const items = Array.from(
              event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
            );
            const index = items.indexOf(document.activeElement as HTMLButtonElement);
            const count = items.length;
            const directions: Record<string, number> = {
              ArrowDown: (index + 1) % count,
              ArrowUp: (index + count - 1) % count,
              Home: 0,
              End: count - 1,
            };
            const next = directions[event.key];
            if (next === undefined) return;
            event.preventDefault();
            items[next]?.focus();
          }}
        >
          {menuActions.map(({ label, run, disabled, danger }, index) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              autoFocus={index === 0}
              tabIndex={-1}
              disabled={disabled}
              className={cn(
                "hover:bg-accent-soft focus-visible:bg-accent-soft min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm focus-visible:outline-none disabled:opacity-50",
                danger && "text-negative",
              )}
              onClick={() => {
                menu.current?.hidePopover();
                run();
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      {sort.isError && (
        <p role="alert" className="text-negative px-1 text-xs">
          {errorText(failureCode(sort.error))}
        </p>
      )}

      <div
        ref={drop.setNodeRef}
        aria-busy={sort.isPending || undefined}
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
                dragEnabled={dragEnabled && !sort.isPending}
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

      {composerOpen ? (
        <div ref={composer}>
          <AddCardForm userId={userId} listId={list.id} onCancel={closeComposer} />
        </div>
      ) : (
        <Button ref={addCardButton} variant="ghost" size="sm" icon={Plus} onClick={focusComposer}>
          {t("projects.card.add")}
        </Button>
      )}
    </section>
  );
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
  const textarea = useRef<HTMLTextAreaElement>(null);
  const measure = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const field = textarea.current;
    const mirror = measure.current;
    if (!field || !mirror) return;
    const resize = () => {
      field.style.height = `${mirror.offsetHeight}px`;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mirror);
    return () => observer.disconnect();
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = title.trim();
    if (value === "" || create.isPending) return;
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
      <Field id={fieldId} label={t("projects.card.titleLabel")} error={error ?? undefined}>
        <div className="relative [--composer-min-height:calc(2lh+18px)]">
          <div
            ref={measure}
            aria-hidden
            className="pointer-events-none invisible absolute inset-x-0 top-0 max-h-36 min-h-(--composer-min-height) overflow-hidden rounded-lg border px-4 py-2 text-base wrap-break-word whitespace-pre-wrap sm:text-sm"
          >
            {title}{" "}
          </div>
          <Textarea
            ref={textarea}
            id={fieldId}
            rows={2}
            className="block max-h-36 min-h-(--composer-min-height) resize-none wrap-break-word transition-[height] duration-150 ease-(--ease-out-snappy) motion-reduce:transition-none"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === "Escape") {
                event.preventDefault();
                event.currentTarget.blur();
                onCancel();
              } else if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (!event.repeat) event.currentTarget.form?.requestSubmit();
              }
            }}
            maxLength={200}
            required
            autoFocus
            invalid={error !== null}
            aria-describedby={describedBy(fieldId, undefined, error ?? undefined)}
          />
        </div>
      </Field>
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
