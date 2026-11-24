// features/projects/board-view.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { ArrowLeft, KanbanSquare, Plus, Settings2, Tags } from "lucide-react";
import { useDebouncedValue } from "@/client/hooks/use-debounce";
import { useShellCommand } from "@/client/hooks/use-shell-command";
import { BoardDock } from "@/components/projects/board-dock";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { dropNeighbours, moveIndex, neighboursAt } from "@/domain/projects/placement";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";
import { hueVar } from "@/lib/ui/hue";
import { BoardSettingsDialog, LabelsDialog, ListActionDialog, ListDialog } from "./board-dialogs";
import { CardDialog } from "./card-dialog";
import { CardFace } from "./card-item";
import type { DragData } from "./drag-types";
import { CONTROL_CLASS, errorText, failureCode } from "./format";
import { AddCardForm, ListColumn } from "./list-column";
import type { Card, List } from "./schemas";
import {
  NO_FILTERS,
  hasActiveFilters,
  useBoardSnapshot,
  useMoveCard,
  useMoveList,
  type CardFilters,
} from "./use-projects";

type DialogState =
  "settings" | "labels" | "newList" | "editList" | "moveList" | "deleteList" | "addCard" | null;

function setOrDelete(params: URLSearchParams, key: string, value: string): void {
  if (value) params.set(key, value);
  else params.delete(key);
}

export function BoardView({ userId, boardId }: { userId: string; boardId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const snapshot = useBoardSnapshot(userId, boardId);
  const boardTop = useRef<HTMLElement>(null);

  // Raw input updates at once. The debounced value drives queries and the URL.
  const [raw, setRaw] = useState<CardFilters>(() => ({
    q: params.get("q") ?? "",
    label: params.get("label") ?? "",
    due: params.get("due") ?? "",
  }));
  const debouncedQ = useDebouncedValue(raw.q.trim(), 300);
  const filters = useMemo<CardFilters>(
    () => ({ q: debouncedQ, label: raw.label, due: raw.due }),
    [debouncedQ, raw.label, raw.due],
  );
  const dragEnabled = !hasActiveFilters(filters);

  useEffect(() => {
    const next = new URLSearchParams(params.toString());
    setOrDelete(next, "q", filters.q);
    setOrDelete(next, "label", filters.label);
    setOrDelete(next, "due", filters.due);
    const text = next.toString();
    if (text !== params.toString()) {
      router.replace(text ? `${pathname}?${text}` : pathname, { scroll: false });
    }
  }, [filters, params, pathname, router]);

  const moveCard = useMoveCard(userId);
  const moveList = useMoveList(userId, boardId);

  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [editing, setEditing] = useState<List | null>(null);
  const [cardListId, setCardListId] = useState("");

  useShellCommand(
    "addCard",
    () => {
      setCardListId("");
      setDialog(snapshot.data?.lists.length ? "addCard" : "newList");
    },
    snapshot.isSuccess,
  );

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // All hooks are above this line. Returns below must not add hooks.
  if (snapshot.isPending) return <BoardSkeleton />;

  if (snapshot.isError || !snapshot.data) {
    return (
      <EmptyState
        icon={KanbanSquare}
        title={t("projects.board.loadError")}
        action={
          <Button variant="secondary" onClick={() => snapshot.refetch()}>
            {t("common.retry")}
          </Button>
        }
      />
    );
  }

  const { board, lists, labels } = snapshot.data;
  const cardList = lists.find((list) => list.id === cardListId) ?? lists[0];

  const onDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    setActiveCard(data?.type === "card" ? data.card : null);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    const from = active.data.current as DragData | undefined;
    const to = over?.data.current as DragData | undefined;
    if (!over || !from || !to) return;

    // Lists can always be reordered, even when filters are active.
    if (from.type === "column") {
      const ids = lists.map((list) => list.id);
      const fromIndex = ids.indexOf(from.listId);
      const toIndex = ids.indexOf(to.listId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
      const next = moveIndex(ids, fromIndex, toIndex);
      const rest = next.filter((id) => id !== from.listId);
      moveList.mutate({ listId: from.listId, ...neighboursAt(rest, next.indexOf(from.listId)) });
      return;
    }

    if (from.type !== "card" || !dragEnabled) return;

    const neighbours = dropNeighbours({
      activeId: from.card.id,
      sourceListId: from.listId,
      sourceIds: from.cardIds,
      overId: String(over.id),
      targetListId: to.listId,
      targetIds: to.cardIds,
      // Dropping on a column or on its list area appends to that list.
      overIsList: to.type !== "card",
    });
    if (neighbours) moveCard.mutate({ cardId: from.card.id, listId: to.listId, ...neighbours });
  };

  const openListDialog = (next: "editList" | "moveList" | "deleteList", list: List) => {
    setEditing(list);
    setDialog(next);
  };

  return (
    <div className="space-y-4 pb-16 max-md:pb-28">
      <header ref={boardTop} className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/projects"
            aria-label={t("projects.back")}
            className="text-ink-muted hover:bg-accent-soft focus-visible:ring-accent grid size-9 shrink-0 place-items-center rounded-lg focus-visible:ring-2"
          >
            <ArrowLeft aria-hidden className="size-4" strokeWidth={1.75} />
          </Link>
          <span
            aria-hidden
            className="block size-3 shrink-0 rounded-full"
            style={{ background: hueVar(board.hue) }}
          />
          <h1 className="truncate text-2xl font-semibold tracking-[-0.02em]">{board.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon={Tags} onClick={() => setDialog("labels")}>
            {t("projects.labels.manage")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Settings2}
            onClick={() => setDialog("settings")}
          >
            {t("projects.board.settings")}
          </Button>
          <Button
            size="sm"
            icon={Plus}
            onClick={() => {
              setEditing(null);
              setDialog("newList");
            }}
          >
            {t("projects.list.add")}
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-3 shadow-(--shadow-card)">
        <Field id="board-search" label={t("projects.filter.search")}>
          <Input
            id="board-search"
            type="search"
            value={raw.q}
            onChange={(event) => setRaw((current) => ({ ...current, q: event.target.value }))}
            maxLength={80}
          />
        </Field>
        <Field id="board-label" label={t("projects.filter.label")}>
          <select
            id="board-label"
            value={raw.label}
            onChange={(event) => setRaw((current) => ({ ...current, label: event.target.value }))}
            className={cn(CONTROL_CLASS, "sm:w-44")}
          >
            <option value="">{t("projects.filter.anyLabel")}</option>
            {labels.map((label) => (
              <option key={label.id} value={label.id}>
                {label.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="board-due" label={t("projects.filter.due")}>
          <select
            id="board-due"
            value={raw.due}
            onChange={(event) => setRaw((current) => ({ ...current, due: event.target.value }))}
            className={cn(CONTROL_CLASS, "sm:w-44")}
          >
            <option value="">{t("projects.filter.anyDue")}</option>
            <option value="overdue">{t("projects.filter.due.overdue")}</option>
            <option value="today">{t("projects.filter.due.today")}</option>
            <option value="week">{t("projects.filter.due.week")}</option>
            <option value="none">{t("projects.filter.due.none")}</option>
          </select>
        </Field>
        {hasActiveFilters(raw) && (
          <Button variant="ghost" size="sm" onClick={() => setRaw(NO_FILTERS)}>
            {t("projects.filter.clear")}
          </Button>
        )}
        {!dragEnabled && (
          <p className="text-ink-muted text-xs">{t("projects.filter.dragDisabled")}</p>
        )}
      </div>

      {(moveCard.isError || moveList.isError) && (
        <p role="alert" className="text-negative text-sm">
          {errorText(failureCode(moveCard.error ?? moveList.error))}
        </p>
      )}

      {lists.length === 0 ? (
        <EmptyState
          icon={KanbanSquare}
          title={t("projects.board.empty")}
          body={t("projects.board.emptyBody")}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveCard(null)}
        >
          <SortableContext
            items={lists.map((list) => `column:${list.id}`)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
              {lists.map((list) => (
                <ListColumn
                  key={list.id}
                  userId={userId}
                  list={list}
                  labels={labels}
                  filters={filters}
                  dragEnabled={dragEnabled}
                  onOpenCard={setOpenCardId}
                  onEditList={(list) => openListDialog("editList", list)}
                  onMoveList={(list) => openListDialog("moveList", list)}
                  onDeleteList={(list) => openListDialog("deleteList", list)}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeCard && (
              <div className="w-72 rounded-xl border border-(--border-subtle) bg-(--bg-surface-elevated) p-2 shadow-(--shadow-card)">
                <CardFace card={activeCard} labels={labels} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <BoardDock userId={userId} boardId={boardId} boardTop={boardTop} />
      <BoardSettingsDialog
        userId={userId}
        open={dialog === "settings"}
        board={board}
        onClose={() => setDialog(null)}
      />
      <LabelsDialog
        userId={userId}
        open={dialog === "labels"}
        boardId={boardId}
        labels={labels}
        onClose={() => setDialog(null)}
      />
      <ListDialog
        userId={userId}
        open={dialog === "newList" || dialog === "editList"}
        boardId={boardId}
        list={dialog === "editList" ? editing : null}
        onClose={() => {
          setDialog(null);
          setEditing(null);
        }}
      />
      {editing && (dialog === "moveList" || dialog === "deleteList") && (
        <ListActionDialog
          key={`${dialog}:${editing.id}`}
          action={dialog}
          list={editing}
          lists={lists}
          moveList={moveList.mutateAsync}
          userId={userId}
          onClose={() => {
            setDialog(null);
            setEditing(null);
          }}
        />
      )}
      <CardDialog
        userId={userId}
        cardId={openCardId}
        lists={lists}
        labels={labels}
        onClose={() => setOpenCardId(null)}
      />
      <Dialog
        solid
        open={dialog === "addCard"}
        onClose={() => setDialog(null)}
        title={t("projects.card.add")}
        closeLabel={t("shell.close")}
      >
        {dialog === "addCard" && cardList && (
          <div className="space-y-4">
            <label className="block space-y-2 text-sm font-medium">
              <span>{t("shell.palette.cardList")}</span>
              <select
                className={CONTROL_CLASS}
                value={cardList.id}
                onChange={(event) => setCardListId(event.target.value)}
              >
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.title}
                  </option>
                ))}
              </select>
            </label>
            <AddCardForm
              userId={userId}
              listId={cardList.id}
              onCancel={() => setDialog(null)}
              onCreated={() => setDialog(null)}
            />
          </div>
        )}
      </Dialog>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div aria-busy="true" className="flex gap-4 overflow-hidden">
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-96 w-72 shrink-0" />
      ))}
    </div>
  );
}
