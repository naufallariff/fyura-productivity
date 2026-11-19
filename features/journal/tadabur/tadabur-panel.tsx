// features/journal/tadabur/tadabur-panel.tsx
"use client";

import { useState } from "react";
import { BookOpenText, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";
import { EntryDialog } from "./entry-dialog";
import { failureCode, tadaburErrorText } from "./errors";
import type { TadaburItem } from "./schemas";
import { useDeleteTadabur, useTadaburList, type TadaburFilters } from "./use-tadabur";

export function TadaburPanel({
  userId,
  today,
  filters,
  onFiltersChange,
}: {
  readonly userId: string;
  readonly today: string;
  readonly filters: TadaburFilters;
  readonly onFiltersChange: (next: TadaburFilters) => void;
}) {
  const list = useTadaburList(userId, filters);
  const remove = useDeleteTadabur(userId);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TadaburItem | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const filtersActive = Boolean(filters.from || filters.to || filters.surah);

  const setFilter = (key: keyof TadaburFilters, value: string) =>
    onFiltersChange({ ...filters, [key]: value === "" ? undefined : value });

  const onDelete = (entryId: string) => {
    if (confirmId !== entryId) {
      setConfirmId(entryId);
      return;
    }
    setError(null);
    remove.mutate(
      { entryId },
      {
        onSettled: () => setConfirmId(null),
        onError: (failure) => setError(tadaburErrorText(failureCode(failure))),
      },
    );
  };

  return (
    <section aria-labelledby="tadabur-title" className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 id="tadabur-title" className="text-sm font-semibold">
            {t("tadabur.title")}
          </h2>
          <p className="text-ink-muted text-xs leading-relaxed">{t("tadabur.lead")}</p>
        </div>
        <Button icon={Plus} onClick={() => setCreating(true)}>
          {t("tadabur.add")}
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field id="tadabur-from" label={t("tadabur.filter.from")}>
          <Input
            id="tadabur-from"
            type="date"
            value={filters.from ?? ""}
            onChange={(event) => setFilter("from", event.target.value)}
          />
        </Field>
        <Field id="tadabur-to" label={t("tadabur.filter.to")}>
          <Input
            id="tadabur-to"
            type="date"
            value={filters.to ?? ""}
            onChange={(event) => setFilter("to", event.target.value)}
          />
        </Field>
        <Field id="tadabur-surah" label={t("tadabur.filter.surah")}>
          <Input
            id="tadabur-surah"
            type="number"
            inputMode="numeric"
            min={1}
            max={114}
            value={filters.surah ?? ""}
            onChange={(event) => setFilter("surah", event.target.value)}
          />
        </Field>
      </div>

      {filtersActive && (
        <Button variant="ghost" size="sm" onClick={() => onFiltersChange({})}>
          {t("tadabur.filter.clear")}
        </Button>
      )}

      {list.isPending && <Skeleton className="h-40" />}

      {list.isError && (
        <EmptyState
          icon={BookOpenText}
          title={t("tadabur.loadError")}
          action={
            <Button variant="secondary" onClick={() => list.refetch()}>
              {t("common.retry")}
            </Button>
          }
        />
      )}

      {list.isSuccess && items.length === 0 && (
        <EmptyState icon={BookOpenText} title={t("tadabur.empty")} />
      )}

      <ul className="space-y-3">
        {items.map((entry) => (
          <li key={entry.id} className="glass space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                {t("tadabur.range", { surah: entry.surah, from: entry.ayatFrom, to: entry.ayatTo })}
              </p>
              <p className="text-ink-muted text-xs tabular-nums">{entry.logDate}</p>
            </div>
            <p className="text-ink line-clamp-3 text-sm leading-relaxed whitespace-pre-line">
              {entry.reflection}
            </p>
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing(entry)}>
                {t("tadabur.edit")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                pending={remove.isPending && remove.variables?.entryId === entry.id}
                className={cn(confirmId === entry.id && "text-negative")}
                onClick={() => onDelete(entry.id)}
              >
                {confirmId === entry.id ? t("tadabur.confirmDelete") : t("tadabur.delete")}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="text-negative text-sm">
          {error}
        </p>
      )}

      {list.hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            pending={list.isFetchingNextPage}
            onClick={() => list.fetchNextPage()}
          >
            {t("tadabur.loadMore")}
          </Button>
        </div>
      )}

      <EntryDialog
        userId={userId}
        open={creating || editing !== null}
        entry={editing}
        defaultDate={today}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    </section>
  );
}
