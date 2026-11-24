"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Command } from "cmdk";
import { CalendarPlus, Lock, Moon, Plus, Search, Sun, Timer, X } from "lucide-react";
import { lockPrivateAction } from "@/features/private/actions";
import { t } from "@/lib/i18n";
import { WORKSPACE_VIEWS, isActivePath } from "@/lib/nav/sections";
import { SHELL_COMMAND_PARAM, type ShellCommand } from "@/lib/shell/commands";
import { useThemeMode } from "./theme-mode";

const OPEN_PALETTE_EVENT = "fyura:open-command-palette";

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const router = useRouter();
  const pathname = usePathname();
  const { mode, toggleMode, saveFailed } = useThemeMode();
  const nextMode = mode === "dark" ? "light" : "dark";
  const label = t("shell.palette.title");

  function close() {
    setOpen(false);
  }

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      input.current?.focus();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  useEffect(() => {
    function show() {
      if (open || document.querySelector("dialog[open], [role=dialog]")) return;
      setOpen(true);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.repeat) return;
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === "k"
      ) {
        if (!open && document.querySelector("dialog[open], [role=dialog]")) return;
        event.preventDefault();
        if (open) close();
        else show();
        return;
      }

      if (!open && event.altKey && event.shiftKey && !event.metaKey && !event.ctrlKey) {
        const view = WORKSPACE_VIEWS.find((item) => event.code === `Digit${item.shortcut}`);
        const target = event.target;
        if (
          !view ||
          (target instanceof HTMLElement &&
            target.closest("input, textarea, select, [contenteditable=true]"))
        )
          return;
        if (document.querySelector("dialog[open], [role=dialog]")) return;
        event.preventDefault();
        router.push(view.href);
      }
    }

    window.addEventListener(OPEN_PALETTE_EVENT, show);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener(OPEN_PALETTE_EVENT, show);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, router]);

  function routeCommand(command: ShellCommand, destination: string) {
    const params =
      pathname === destination
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();
    params.set(SHELL_COMMAND_PARAM, command);
    router.push(`${destination}?${params}`, { scroll: pathname !== destination });
  }

  function select(action: () => void) {
    return () => {
      close();
      action();
    };
  }

  return (
    <>
      <p
        role="status"
        className={
          saveFailed
            ? "fixed right-4 bottom-24 z-50 rounded-lg border border-(--border-subtle) bg-(--bg-surface) px-4 py-2 text-sm shadow-(--shadow-raised) md:bottom-4"
            : "sr-only"
        }
      >
        {saveFailed && t("shell.theme.saveFailed")}
      </p>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="text-ink backdrop:bg-ink/30 fixed inset-x-4 top-12 mx-auto w-auto max-w-xl overflow-hidden rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-0 shadow-(--shadow-raised) transition-none backdrop:transition-none sm:top-24"
      >
        {open && (
          <Command label={t("shell.palette.placeholder")} vimBindings={false} loop>
            <h2 id={titleId} className="sr-only">
              {label}
            </h2>
            <div className="border-line text-ink-muted focus-within:border-accent flex items-center gap-3 border-b px-4">
              <Search aria-hidden className="size-5 shrink-0" />
              <Command.Input
                ref={input}
                placeholder={t("shell.palette.placeholder")}
                className="text-ink placeholder:text-ink-muted min-w-0 flex-1 py-4 text-base outline-hidden"
              />
              <button
                type="button"
                aria-label={t("shell.close")}
                onClick={close}
                className="hover:bg-accent-soft grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>
            <Command.List
              label={t("shell.palette.results")}
              className="max-h-[min(60dvh,28rem)] scroll-py-2 overflow-y-auto p-2"
            >
              <Command.Empty className="text-ink-muted p-4 text-sm">
                {t("shell.palette.empty")}
              </Command.Empty>
              <Command.Group heading={t("shell.palette.navigation")} className="palette-group">
                {WORKSPACE_VIEWS.map(({ href, labelKey, icon: Icon, shortcut }) => (
                  <PaletteItem
                    key={href}
                    label={t(labelKey)}
                    keywords={[href.slice(1)]}
                    onSelect={select(() => router.push(href))}
                  >
                    <Icon aria-hidden className="size-4 shrink-0" />
                    <kbd className="text-ink-muted order-last ml-auto font-sans text-xs">
                      {t("shell.navShortcut", { key: shortcut })}
                    </kbd>
                  </PaletteItem>
                ))}
              </Command.Group>
              <Command.Group heading={t("shell.palette.actions")} className="palette-group">
                <PaletteItem
                  label={t("shell.palette.createBlock")}
                  onSelect={select(() => routeCommand("createBlock", "/daily-tracker"))}
                >
                  <CalendarPlus aria-hidden className="size-4 shrink-0" />
                </PaletteItem>
                <PaletteItem
                  label={t("shell.palette.addCard")}
                  onSelect={select(() =>
                    routeCommand(
                      "addCard",
                      isActivePath(pathname, "/projects") ? pathname : "/projects",
                    ),
                  )}
                >
                  <Plus aria-hidden className="size-4 shrink-0" />
                </PaletteItem>
                <PaletteItem
                  label={t("shell.palette.lockPrivate")}
                  onSelect={select(() => {
                    void lockPrivateAction();
                  })}
                >
                  <Lock aria-hidden className="size-4 shrink-0" />
                </PaletteItem>
                <PaletteItem
                  label={t("shell.palette.startFocus")}
                  onSelect={select(() => routeCommand("startFocus", "/daily-tracker"))}
                >
                  <Timer aria-hidden className="size-4 shrink-0" />
                </PaletteItem>
              </Command.Group>
              <Command.Group heading={t("shell.palette.theme")} className="palette-group">
                <PaletteItem
                  label={t(`shell.theme.switch.${nextMode}`)}
                  onSelect={select(toggleMode)}
                >
                  {nextMode === "dark" ? (
                    <Moon aria-hidden className="size-4" />
                  ) : (
                    <Sun aria-hidden className="size-4" />
                  )}
                </PaletteItem>
              </Command.Group>
            </Command.List>
          </Command>
        )}
      </dialog>
    </>
  );
}

function PaletteItem({
  label,
  keywords,
  children,
  onSelect,
}: {
  label: string;
  keywords?: string[];
  children: ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={label}
      keywords={keywords}
      onSelect={onSelect}
      className="aria-selected:bg-accent-soft flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm"
    >
      {children}
      <span className="order-0">{label}</span>
    </Command.Item>
  );
}
