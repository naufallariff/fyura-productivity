"use client";

import { useSyncExternalStore } from "react";
import { saveThemeAction } from "@/features/settings/actions";
import { DEFAULT_SELECTION, parseSelection, type ThemeSelection } from "@/lib/theme/resolve";

const THEME_CHANGE = "fyura:theme";
let pending: Promise<void> | undefined;
let savedSelection = DEFAULT_SELECTION;
let status: "idle" | "saving" | "saved" | "error" = "idle";

function subscribe(notify: () => void) {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme", "data-mode"] });
  window.addEventListener(THEME_CHANGE, notify);
  return () => {
    observer.disconnect();
    window.removeEventListener(THEME_CHANGE, notify);
  };
}

function readSelection(): ThemeSelection {
  const { theme: bundle, mode } = document.documentElement.dataset;
  return parseSelection({ bundle, mode });
}

function selectionKey({ bundle, mode }: ThemeSelection): string {
  return `${bundle}:${mode}`;
}

function getSelectionKey(): string {
  return selectionKey(readSelection());
}

function writeSelection({ bundle, mode }: ThemeSelection) {
  const root = document.documentElement;
  root.dataset.theme = bundle;
  root.dataset.mode = mode;
  const cookieOptions = `Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
  document.cookie = `theme-bundle=${bundle}; ${cookieOptions}`;
  document.cookie = `theme-mode=${mode}; ${cookieOptions}`;
}

function notifyChange() {
  window.dispatchEvent(new Event(THEME_CHANGE));
}

function selectTheme(change: Partial<ThemeSelection>) {
  const current = readSelection();
  const next = { ...current, ...change };
  if (selectionKey(next) === selectionKey(current)) return;
  if (!pending) savedSelection = current;
  status = "saving";
  writeSelection(next);
  notifyChange();

  // Settings and shell controls share a queue, so a slower save cannot overtake a later choice.
  const previous = pending ?? Promise.resolve();
  const write = previous
    .then(async () => {
      try {
        const result = await saveThemeAction({
          ...change,
          ...(savedSelection.bundle !== next.bundle && { bundle: next.bundle }),
          ...(savedSelection.mode !== next.mode && { mode: next.mode }),
        });
        if (result.ok) {
          savedSelection = next;
          if (pending === write) status = "saved";
          return;
        }
      } catch {
        // A transport failure follows the same recovery path as an action error.
      }
      if (pending === write) {
        status = "error";
        writeSelection(savedSelection);
      }
    })
    .finally(() => {
      if (pending === write) {
        pending = undefined;
        notifyChange();
      }
    });
  pending = write;
}

function toggleMode() {
  selectTheme({ mode: readSelection().mode === "dark" ? "light" : "dark" });
}

export function useThemeSelection(current: ThemeSelection = DEFAULT_SELECTION) {
  const key = useSyncExternalStore(subscribe, getSelectionKey, () => selectionKey(current));
  const [bundle, mode] = key.split(":");
  const saveStatus = useSyncExternalStore(
    subscribe,
    () => status,
    () => "idle" as const,
  );
  return { selection: parseSelection({ bundle, mode }), selectTheme, saveStatus };
}

export function useThemeMode() {
  const { selection, saveStatus } = useThemeSelection();
  return { mode: selection.mode, toggleMode, saveFailed: saveStatus === "error" };
}
