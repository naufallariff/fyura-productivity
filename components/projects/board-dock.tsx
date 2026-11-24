"use client";

import Link from "next/link";
import { useEffect, useId, useRef, type RefObject } from "react";
import { CalendarDays, Inbox, KanbanSquare, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBoardsIndex } from "@/features/projects/use-projects";
import { t } from "@/lib/i18n";

const pillClass =
  "press-feedback text-ink hover:bg-accent-soft focus-visible:ring-accent flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-2 text-xs font-medium whitespace-nowrap focus-visible:ring-2 sm:px-3 sm:text-sm";

export function BoardDock({
  userId,
  boardId,
  boardTop,
}: {
  userId: string;
  boardId: string;
  boardTop: RefObject<HTMLElement | null>;
}) {
  const pickerId = useId();
  const inbox = useRef<HTMLAnchorElement>(null);
  const planner = useRef<HTMLAnchorElement>(null);
  const board = useRef<HTMLButtonElement>(null);
  const switchBoards = useRef<HTMLButtonElement>(null);
  const picker = useRef<HTMLDivElement>(null);
  const boards = useBoardsIndex(userId, false);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if (
        !event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        (event.target instanceof Element &&
          event.target.closest("input, textarea, select, [contenteditable], dialog"))
      )
        return;

      const controls = [inbox, planner, board, switchBoards];
      const control = controls[Number(event.key) - 1]?.current;
      if (!control) return;
      event.preventDefault();
      if (control === switchBoards.current) control.focus();
      control.click();
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  return (
    <nav
      aria-label={t("projects.dock.label")}
      data-glass-permitted
      className="glass fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-(--glass-border) bg-(--glass-bg) p-1 shadow-(--shadow-raised) max-md:bottom-[calc(5rem+env(safe-area-inset-bottom))]"
    >
      <Link ref={inbox} href="/capture" aria-keyshortcuts="Alt+1" className={pillClass}>
        <Inbox aria-hidden className="size-4 max-sm:hidden" />
        {t("projects.dock.inbox")}
      </Link>
      <Link ref={planner} href="/weekly-plan" aria-keyshortcuts="Alt+2" className={pillClass}>
        <CalendarDays aria-hidden className="size-4 max-sm:hidden" />
        {t("projects.dock.planner")}
      </Link>
      <button
        ref={board}
        type="button"
        aria-keyshortcuts="Alt+3"
        className={pillClass}
        onClick={() =>
          boardTop.current?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "instant"
              : "smooth",
            block: "start",
          })
        }
      >
        <KanbanSquare aria-hidden className="size-4 max-sm:hidden" />
        {t("projects.dock.board")}
      </button>
      <button
        ref={switchBoards}
        type="button"
        popoverTarget={pickerId}
        aria-keyshortcuts="Alt+4"
        className={pillClass}
      >
        <LayoutGrid aria-hidden className="size-4 max-sm:hidden" />
        {t("projects.dock.switchBoards")}
      </button>
      <div
        ref={picker}
        id={pickerId}
        popover="auto"
        role="group"
        tabIndex={-1}
        aria-label={t("projects.dock.switchBoards")}
        onToggle={(event) => {
          const panel = event.currentTarget;
          if (event.newState === "open") {
            (panel.querySelector<HTMLElement>('[aria-current="page"], a, button') ?? panel).focus();
          }
        }}
        className="text-ink fixed inset-auto bottom-21 left-1/2 m-0 max-h-[50dvh] w-64 -translate-x-1/2 overflow-y-auto rounded-xl border border-(--border-subtle) bg-(--bg-surface-elevated) p-2 shadow-(--shadow-raised) max-md:bottom-[calc(8.75rem+env(safe-area-inset-bottom))]"
      >
        {boards.isPending && (
          <p role="status" className="p-2 text-sm">
            {t("projects.dock.loading")}
          </p>
        )}
        {boards.isError && (
          <Button variant="ghost" onClick={() => boards.refetch()}>
            {t("common.retry")}
          </Button>
        )}
        {boards.isSuccess && boards.data.pages[0]?.items.length === 0 && (
          <p className="p-2 text-sm">{t("projects.dock.empty")}</p>
        )}
        <ul>
          {boards.data?.pages
            .flatMap((page) => page.items)
            .map((item) => (
              <li key={item.id}>
                <Link
                  href={`/projects/${item.id}`}
                  aria-current={item.id === boardId ? "page" : undefined}
                  onNavigate={() => picker.current?.hidePopover()}
                  className="hover:bg-accent-soft aria-[current=page]:bg-accent-soft flex min-h-11 items-center rounded-lg px-3 text-sm"
                >
                  {item.title}
                </Link>
              </li>
            ))}
        </ul>
        {boards.hasNextPage && (
          <Button
            variant="ghost"
            pending={boards.isFetchingNextPage}
            onClick={() => boards.fetchNextPage()}
          >
            {t("projects.list.loadMore")}
          </Button>
        )}
      </div>
    </nav>
  );
}
