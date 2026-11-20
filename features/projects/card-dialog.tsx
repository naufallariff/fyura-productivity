// features/projects/card-dialog.tsx
"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { Pill } from "@/components/ui/pill";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";
import { CONTROL_CLASS, TEXTAREA_CLASS, errorText, failureCode } from "./format";
import type { CardDetail, Label, List } from "./schemas";
import {
  useCardDetail,
  useCreateChecklistItem,
  useDeleteChecklistItem,
  useMoveCard,
  useSetCardLabel,
  useUpdateCard,
  useUpdateChecklistItem,
} from "./use-projects";

export function CardDialog({
  userId,
  cardId,
  lists,
  labels,
  onClose,
}: {
  userId: string;
  cardId: string | null;
  lists: readonly List[];
  labels: readonly Label[];
  onClose: () => void;
}) {
  const detail = useCardDetail(userId, cardId);

  return (
    <Dialog
      open={cardId !== null}
      onClose={onClose}
      title={t("projects.card.title")}
      closeLabel={t("shell.close")}
    >
      {cardId !== null && detail.isPending && <Skeleton className="h-64" />}

      {detail.isError && (
        <div className="space-y-2">
          <p role="alert" className="text-negative text-sm">
            {t("projects.card.loadError")}
          </p>
          <Button variant="secondary" onClick={() => detail.refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      )}

      {detail.data && (
        <CardEditor
          key={detail.data.id}
          userId={userId}
          card={detail.data}
          lists={lists}
          labels={labels}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
}

function CardEditor({
  userId,
  card,
  lists,
  labels,
  onClose,
}: {
  userId: string;
  card: CardDetail;
  lists: readonly List[];
  labels: readonly Label[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [dueOn, setDueOn] = useState(card.dueOn ?? "");
  const [dueComplete, setDueComplete] = useState(card.dueComplete);
  const [newItem, setNewItem] = useState("");
  const [moveListId, setMoveListId] = useState(card.listId);
  const [placement, setPlacement] = useState<"TOP" | "BOTTOM">("BOTTOM");
  const [error, setError] = useState<string | null>(null);

  const update = useUpdateCard(userId);
  const setLabel = useSetCardLabel(userId);
  const addItem = useCreateChecklistItem(userId, card.id);
  const toggleItem = useUpdateChecklistItem(userId, card.id);
  const removeItem = useDeleteChecklistItem(userId, card.id);
  const move = useMoveCard(userId);

  const fail = (failure: unknown) => setError(errorText(failureCode(failure)));

  const onSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = title.trim();
    if (value === "") {
      setError(errorText("VALIDATION_FAILED"));
      return;
    }
    const text = description.trim();
    setError(null);
    update.mutate(
      {
        cardId: card.id,
        title: value,
        description: text === "" ? null : text,
        dueOn: dueOn === "" ? null : dueOn,
        dueComplete,
      },
      { onError: fail },
    );
  };

  const onAddItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = newItem.trim();
    if (value === "") return;
    addItem.mutate(
      { cardId: card.id, title: value },
      { onSuccess: () => setNewItem(""), onError: fail },
    );
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSave} className="grid gap-4">
        <Field id="card-title" label={t("projects.field.title")}>
          <Input
            id="card-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            required
          />
        </Field>

        <Field id="card-description" label={t("projects.field.description")}>
          <textarea
            id="card-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={10000}
            rows={4}
            className={TEXTAREA_CLASS}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="card-due" label={t("projects.field.due")}>
            <Input
              id="card-due"
              type="date"
              value={dueOn}
              onChange={(event) => setDueOn(event.target.value)}
            />
          </Field>
          <label className="flex min-h-11 items-center gap-3 self-end text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={dueComplete}
              onChange={(event) => setDueComplete(event.target.checked)}
            />
            {t("projects.field.dueComplete")}
          </label>
        </div>

        {error && (
          <p role="alert" className="text-negative text-sm">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="danger"
            pending={update.isPending}
            onClick={() =>
              update.mutate(
                { cardId: card.id, archived: true },
                { onSuccess: onClose, onError: fail },
              )
            }
          >
            {t("projects.card.archive")}
          </Button>
          <Button type="submit" pending={update.isPending}>
            {t("common.save")}
          </Button>
        </div>
      </form>

      <section aria-labelledby="card-labels-title" className="space-y-2">
        <h3 id="card-labels-title" className="text-sm font-semibold">
          {t("projects.card.labels")}
        </h3>
        {labels.length === 0 && (
          <p className="text-ink-muted text-xs">{t("projects.card.noLabels")}</p>
        )}
        <ul className="flex flex-wrap gap-2">
          {labels.map((label) => {
            const checked = card.labelIds.includes(label.id);
            return (
              <li key={label.id}>
                <label
                  className={cn(
                    "focus-within:ring-accent flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs font-medium focus-within:ring-2",
                    checked ? "border-accent bg-accent-soft" : "border-line",
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() =>
                      setLabel.mutate(
                        { cardId: card.id, labelId: label.id, on: !checked },
                        { onError: fail },
                      )
                    }
                  />
                  <Pill hue={label.hue}>{label.name}</Pill>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="card-checklist-title" className="space-y-2">
        <h3 id="card-checklist-title" className="text-sm font-semibold">
          {t("projects.card.checklist")}
        </h3>
        <ul className="space-y-1">
          {card.items.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4"
                checked={item.done}
                aria-label={item.title}
                onChange={() =>
                  toggleItem.mutate({ itemId: item.id, done: !item.done }, { onError: fail })
                }
              />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm",
                  item.done && "text-ink-muted line-through",
                )}
              >
                {item.title}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={Trash2}
                aria-label={t("projects.card.deleteItem", { title: item.title })}
                className="size-8 p-0"
                onClick={() => removeItem.mutate({ itemId: item.id }, { onError: fail })}
              />
            </li>
          ))}
        </ul>
        <form onSubmit={onAddItem} className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Field id="card-new-item" label={t("projects.card.itemLabel")}>
              <Input
                id="card-new-item"
                value={newItem}
                onChange={(event) => setNewItem(event.target.value)}
                maxLength={200}
              />
            </Field>
          </div>
          <Button type="submit" variant="secondary" pending={addItem.isPending}>
            {t("projects.card.addItem")}
          </Button>
        </form>
      </section>

      <section aria-labelledby="card-move-title" className="space-y-2">
        <h3 id="card-move-title" className="text-sm font-semibold">
          {t("projects.card.moveTitle")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <Field id="card-move-list" label={t("projects.field.list")}>
            <select
              id="card-move-list"
              value={moveListId}
              onChange={(event) => setMoveListId(event.target.value)}
              className={CONTROL_CLASS}
            >
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.title}
                </option>
              ))}
            </select>
          </Field>
          <Field id="card-move-place" label={t("projects.field.position")}>
            <select
              id="card-move-place"
              value={placement}
              onChange={(event) => setPlacement(event.target.value as "TOP" | "BOTTOM")}
              className={CONTROL_CLASS}
            >
              <option value="TOP">{t("projects.card.moveTop")}</option>
              <option value="BOTTOM">{t("projects.card.moveBottom")}</option>
            </select>
          </Field>
          <Button
            type="button"
            variant="secondary"
            pending={move.isPending}
            onClick={() =>
              move.mutate(
                { cardId: card.id, listId: moveListId, beforeId: null, afterId: null, placement },
                { onError: fail },
              )
            }
          >
            {t("projects.card.moveAction")}
          </Button>
        </div>
      </section>
    </div>
  );
}
