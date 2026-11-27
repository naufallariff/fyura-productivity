"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Bell, Moon, Settings } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";
import { SignOutButton } from "./sign-out-button";
import { useThemeMode } from "./theme-mode";

/**
 * Account area at the bottom of the sidebar. The menu is a disclosure, not a
 * role=menu, so every item is reachable with Tab and no custom arrow keys are needed.
 */
export function SidebarProfile({
  email,
  collapsed,
  placement = "above",
}: {
  email: string | null;
  collapsed: boolean;
  placement?: "above" | "below";
}) {
  const [open, setOpen] = useState(false);
  const { mode, toggleMode } = useThemeMode();
  const dark = mode === "dark";
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const label = email ?? t("shell.account");

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        setOpen(false);
        trigger.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "hover:bg-accent-soft focus-visible:ring-accent flex min-h-11 w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-200 focus-visible:ring-2",
          collapsed && "justify-center px-0",
        )}
      >
        <Avatar name={label} size="md" />
        {collapsed ? (
          <span className="sr-only">{t("shell.account")}</span>
        ) : (
          <span className="text-ink min-w-0 truncate text-sm">{label}</span>
        )}
      </button>
      {open && (
        <div
          id={menuId}
          className={cn(
            "account-popover w-64 space-y-1 p-2",
            placement === "below" ? "top-full right-0 mt-2" : "bottom-full left-0 mb-2",
          )}
        >
          <p className="text-ink-muted truncate px-3 pt-1 pb-2 text-xs">{label}</p>

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="text-ink-muted hover:bg-accent-soft hover:text-ink focus-visible:ring-accent flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-200 focus-visible:ring-2"
          >
            <Settings aria-hidden className="size-4" strokeWidth={1.75} />
            {t("shell.settings")}
          </Link>

          <button
            type="button"
            role="switch"
            aria-checked={dark}
            onClick={toggleMode}
            className="text-ink-muted hover:bg-accent-soft hover:text-ink flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium"
          >
            <Moon aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
            {t("shell.theme.darkMode")}
            <span
              aria-hidden
              className={cn(
                "ml-auto flex h-5 w-9 items-center rounded-full p-0.5",
                dark ? "bg-accent" : "bg-(--border-default)",
              )}
            >
              <span
                className={cn(
                  "size-4 rounded-full bg-(--bg-surface) motion-safe:transition-transform",
                  dark && "translate-x-4",
                )}
              />
            </span>
          </button>

          <div className="text-ink-muted flex items-start gap-3 rounded-lg px-3 py-2 text-sm">
            <Bell aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
            <div className="min-w-0">
              <p className="text-ink font-medium">{t("shell.notifications")}</p>
              <p className="text-xs">{t("shell.notificationsEmpty")}</p>
            </div>
          </div>

          <SignOutButton />
        </div>
      )}
    </div>
  );
}
