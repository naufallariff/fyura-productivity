// features/projects/board-index.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { KanbanSquare, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Segmented, type SegmentedOption } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";
import { hueVar } from "@/lib/ui/hue";
import { NewBoardDialog } from "./board-dialogs";
import { formatUpdated } from "./format";
import type { Board } from "./schemas";
import { useBoardsIndex, useUpdateBoard } from "./use-projects";

type View = "active" | "archived";

const VIEW_OPTIONS: SegmentedOption<View>[] = [
  { value: "active", label: t("projects.index.active") },
  { value: "archived", label: t("projects.index.archived") },
];

export function BoardIndex({ userId }: { userId: string }) {
  const [view, setView] = useState<View>("active");
  const [creating, setCreating] = useState(false);
  const boards = useBoardsIndex(userId, view === "archived");
  const update = useUpdateBoard(userId);

  const items = boards.data?.pages.flatMap((page) => page.items) ?? [];
  // Starred boards first. The server order (most recently updated) is kept within each group.
  const ordered = [...items].sort((a, b) => Number(b.starred) - Number(a.starred));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label={t("projects.index.view")}
          options={VIEW_OPTIONS}
          value={view}
          onChange={setView}
        />
        <Button icon={Plus} onClick={() => setCreating(true)}>
          {t("projects.index.new")}
        </Button>
      </div>

      {boards.isPending && (
        <div aria-busy="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {boards.isError && (
        <EmptyState
          icon={KanbanSquare}
          title={t("projects.index.loadError")}
          action={
            <Button variant="secondary" onClick={() => boards.refetch()}>
              {t("common.retry")}
            </Button>
          }
        />
      )}

      {boards.isSuccess && ordered.length === 0 && (
        <EmptyState
          icon={KanbanSquare}
          title={t("projects.index.empty")}
          body={t("projects.index.emptyBody")}
        />
      )}

      {ordered.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ordered.map((board) => (
            <BoardTile
              key={board.id}
              board={board}
              onStar={() => update.mutate({ boardId: board.id, starred: !board.starred })}
            />
          ))}
        </ul>
      )}

      {boards.hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            pending={boards.isFetchingNextPage}
            onClick={() => boards.fetchNextPage()}
          >
            {t("projects.index.loadMore")}
          </Button>
        </div>
      )}

      <NewBoardDialog userId={userId} open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function BoardTile({ board, onStar }: { board: Board; onStar: () => void }) {
  return (
    <li className="relative rounded-2xl border border-(--border-subtle) bg-(--bg-surface) shadow-(--shadow-card)">
      <Link
        href={`/projects/${board.id}`}
        className="focus-visible:ring-accent ease-spring block h-full rounded-2xl p-4 transition-transform duration-200 focus-visible:ring-2 motion-safe:active:scale-[0.98]"
      >
        <span
          aria-hidden
          className="block h-1.5 w-12 rounded-full"
          style={{ background: hueVar(board.hue) }}
        />
        <span className="mt-4 block truncate text-base font-semibold">{board.title}</span>
        <span className="text-ink-muted mt-1 block text-xs tabular-nums">
          {t("projects.index.updated", { date: formatUpdated(board.updatedAt) })}
        </span>
      </Link>
      <button
        type="button"
        onClick={onStar}
        aria-pressed={board.starred}
        aria-label={t("projects.index.star", { title: board.title })}
        className="text-ink-muted hover:text-ink hover:bg-accent-soft focus-visible:ring-accent absolute top-3 right-3 grid size-9 place-items-center rounded-lg focus-visible:ring-2"
      >
        <Star
          aria-hidden
          strokeWidth={1.75}
          className={cn("size-4", board.starred && "text-accent fill-current")}
        />
      </button>
    </li>
  );
}
