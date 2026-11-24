"use client";

import { useSyncExternalStore } from "react";
import { saveThemeModeAction } from "@/features/settings/actions";
import type { Mode } from "@/lib/theme/bundles";

const THEME_CHANGE = "fyura:theme-mode";
let pending: Promise<void> | undefined;
let savedMode: Mode = "light";
let failed = false;

function subscribe(notify: () => void) {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributeFilter: ["data-mode"] });
  window.addEventListener(THEME_CHANGE, notify);
  return () => {
    observer.disconnect();
    window.removeEventListener(THEME_CHANGE, notify);
  };
}

function getMode(): Mode {
  return document.documentElement.getAttribute("data-mode") === "dark" ? "dark" : "light";
}

function applyMode(mode: Mode) {
  document.documentElement.setAttribute("data-mode", mode);
  document.cookie = `theme-mode=${mode}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
  window.dispatchEvent(new Event(THEME_CHANGE));
}

function toggleMode() {
  const current = getMode();
  if (!pending) savedMode = current;
  const mode = current === "dark" ? "light" : "dark";
  failed = false;
  applyMode(mode);

  // Keep writes in click order even when both shell controls are used rapidly.
  const previous = pending ?? Promise.resolve();
  const write = previous
    .then(async () => {
      try {
        const result = await saveThemeModeAction({ mode });
        if (result.ok) {
          savedMode = mode;
          return;
        }
      } catch {
        // A transport failure follows the same recovery path as an action error.
      }
      if (pending === write) {
        failed = true;
        applyMode(savedMode);
      }
    })
    .finally(() => {
      if (pending === write) pending = undefined;
    });
  pending = write;
}

export function useThemeMode() {
  const mode = useSyncExternalStore(subscribe, getMode, () => "light" as const);
  const saveFailed = useSyncExternalStore(
    subscribe,
    () => failed,
    () => false,
  );
  return { mode, toggleMode, saveFailed };
}
