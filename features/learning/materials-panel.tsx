// features/learning/materials-panel.tsx
"use client";

import { useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";
import { ItemDialog, ProgressDialog } from "./item-dialogs";
import { errorText, failureCode } from "./errors";
import type { Item, Subject } from "./schemas";
import { SubjectDialog } from "./subject-dialog";
import {
  useItems,
  usePurgeItem,
  useSubjects,
  useUpdateItem,
  type ItemFilters,
} from "./use-learning";

export function MaterialsPanel({
  userId,
  today,
}: {
  readonly userId: string;
  readonly today: string;
}) {
  const subjects = useSubjects(userId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (subjects.isPending) return <Skeleton className="h-64" />;

  if (subjects.isError || !subjects.data) {
    return (
      <EmptyState
        icon={BookOpen}
        title={t("learning.subjects.loadError")}
        action={
          <Button variant="secondary" onClick={() => subjects.refetch()}>
            {t("common.retry")}
          </Button>
        }
      />
    );
  }

  const visible = subjects.data.items.filter((subject) => subject.status !== "ARCHIVED");
  const selected = visible.find((subject) => subject.id === selectedId) ?? visible[0] ?? null;

  return (
    <section aria-labelledby="materials-title" className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 id="materials-title" className="text-sm font-semibold">
            {t("learning.subjects.title")}
          </h2>
          <p className="text-ink-muted text-xs tabular-nums">
            {t("learning.subjects.wip", {
              count: subjects.data.activeCount,
              limit: subjects.data.wipLimit,
            })}
          </p>
        </div>
        <Button icon={Plus} onClick={() => setCreatingSubject(true)}>
          {t("learning.subjects.add")}
        </Button>
      </header>

      {notice && (
        <p role="status" className="text-ink-muted text-sm">
          {notice}
        </p>
      )}

      {visible.length === 0 ? (
        <EmptyState icon={BookOpen} title={t("learning.subjects.empty")} />
      ) : (
        <>
          <ul className="flex flex-wrap gap-2">
            {visible.map((subject) => (
              <li key={subject.id}>
                <button
                  type="button"
                  aria-pressed={selected?.id === subject.id}
                  onClick={() => setSelectedId(subject.id)}
                  className={cn(
                    "focus-visible:ring-accent inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-xs font-medium focus-visible:ring-2",
                    selected?.id === subject.id
                      ? "border-accent bg-accent-soft"
                      : "border-line text-ink-muted",
                  )}
                >
                  {subject.name}
                  <Pill>{t(`learning.status.${subject.status}`)}</Pill>
                </button>
              </li>
            ))}
          </ul>
          {selected && <ItemsPanel userId={userId} subject={selected} today={today} />}
        </>
      )}

      <SubjectDialog
        userId={userId}
        open={creatingSubject}
        onClose={() => setCreatingSubject(false)}
        onSaved={(warning) =>
          setNotice(
            warning
              ? t("learning.subjects.wipWarning", { limit: subjects.data?.wipLimit ?? 0 })
              : t("learning.subjects.saved"),
          )
        }
      />
    </section>
  );
}

function ItemsPanel({
  userId,
  subject,
  today,
}: {
  readonly userId: string;
  readonly subject: Subject;
  readonly today: string;
}) {
  const [showArchived, setShowArchived] = useState(false);
  const filters: ItemFilters = {
    subjectId: subject.id,
    status: showArchived ? "ARCHIVED" : undefined,
  };
  const items = useItems(userId, filters);
  const rows = items.data?.pages.flatMap((page) => page.items) ?? [];

  const [editing, setEditing] = useState<Item | null>(null);
  const [creating, setCreating] = useState(false);
  const [progressFor, setProgressFor] = useState<Item | null>(null);

  return (
    <section aria-labelledby="items-title" className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="items-title" className="text-sm font-semibold">
          {t("learning.items.title")}
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-h-9 items-center gap-2 text-xs">
            <input
              type="checkbox"
              className="size-4"
              checked={showArchived}
              onChange={(event) => setShowArchived(event.target.checked)}
            />
            {t("learning.items.showArchived")}
          </label>
          <Button size="sm" icon={Plus} onClick={() => setCreating(true)}>
            {t("learning.items.add")}
          </Button>
        </div>
      </header>

      {items.isPending && <Skeleton className="h-24" />}

      {items.isSuccess && rows.length === 0 && (
        <p className="text-ink-muted text-sm">{t("learning.items.empty")}</p>
      )}

      <ul className="space-y-3">
        {rows.map((item) => (
          <li key={item.id}>
            <ItemRow
              userId={userId}
              item={item}
              onEdit={() => setEditing(item)}
              onProgress={() => setProgressFor(item)}
            />
          </li>
        ))}
      </ul>

      {items.hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            pending={items.isFetchingNextPage}
            onClick={() => items.fetchNextPage()}
          >
            {t("learning.items.loadMore")}
          </Button>
        </div>
      )}

      <ItemDialog
        userId={userId}
        subjectId={subject.id}
        item={editing}
        open={creating || editing !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
      <ProgressDialog
        userId={userId}
        item={progressFor}
        today={today}
        open={progressFor !== null}
        onClose={() => setProgressFor(null)}
      />
    </section>
  );
}

function ItemRow({
  userId,
  item,
  onEdit,
  onProgress,
}: {
  readonly userId: string;
  readonly item: Item;
  readonly onEdit: () => void;
  readonly onProgress: () => void;
}) {
  const update = useUpdateItem(userId);
  const purge = usePurgeItem(userId);
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const archived = item.status === "ARCHIVED";
  const percent =
    item.totalUnits && item.totalUnits > 0
      ? Math.min(100, Math.round((item.completedUnits / item.totalUnits) * 100))
      : null;

  const toggleArchive = () => {
    setError(null);
    update.mutate(
      { itemId: item.id, status: archived ? "QUEUED" : "ARCHIVED" },
      { onError: (failure) => setError(errorText(failureCode(failure))) },
    );
  };

  const onPurge = () => {
    if (!confirmPurge) {
      setConfirmPurge(true);
      return;
    }
    setError(null);
    purge.mutate(
      { itemId: item.id },
      {
        onSettled: () => setConfirmPurge(false),
        onError: (failure) => setError(errorText(failureCode(failure))),
      },
    );
  };

  return (
    <article className="glass space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold">{item.title}</p>
        <Pill>{t(`learning.itemKind.${item.kind}`)}</Pill>
        <Pill>{t(`learning.status.${item.status}`)}</Pill>
      </div>

      <div className="space-y-1">
        <p className="text-ink-muted text-xs tabular-nums">
          {item.totalUnits
            ? t("learning.items.count", { completed: item.completedUnits, total: item.totalUnits })
            : t("learning.items.completed", { completed: item.completedUnits })}
        </p>
        {percent !== null && (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="bg-ink/10 h-1.5 w-full overflow-hidden rounded-full"
          >
            <div className="bg-accent h-full rounded-full" style={{ width: `${percent}%` }} />
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-negative text-xs">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-1">
        {!archived && (
          <Button variant="ghost" size="sm" onClick={onProgress}>
            {t("learning.items.log")}
          </Button>
        )}
        {!archived && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            {t("learning.items.edit")}
          </Button>
        )}
        <Button variant="ghost" size="sm" pending={update.isPending} onClick={toggleArchive}>
          {archived ? t("learning.items.restore") : t("learning.items.archive")}
        </Button>
        {archived && (
          <Button
            variant="danger"
            size="sm"
            pending={purge.isPending}
            className={cn(confirmPurge && "font-semibold")}
            onClick={onPurge}
          >
            {confirmPurge ? t("learning.items.purgeConfirm") : t("learning.items.purge")}
          </Button>
        )}
      </div>

      {archived && confirmPurge && (
        <p className="text-ink-muted text-xs leading-relaxed">{t("learning.items.purgeLead")}</p>
      )}
    </article>
  );
}
