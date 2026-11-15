"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Bell, Settings } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";
import { SignOutButton } from "./sign-out-button";

/**
 * Account area at the bottom of the sidebar. The menu is a disclosure, not a
 * role=menu, so every item is reachable with Tab and no custom arrow keys are needed.
 */
export function SidebarProfile({ email, collapsed }: { email: string | null; collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const label = email ?? t("shell.account");

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
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
      {open && (
        <div id={menuId} className="glass absolute bottom-full left-0 z-50 mb-2 w-64 space-y-1 p-2">
          <p className="text-ink-muted truncate px-3 pt-1 pb-2 text-xs">{label}</p>

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="rounded-control text-ink-muted hover:bg-accent-soft hover:text-ink focus-visible:ring-accent flex min-h-11 items-center gap-3 px-3 text-sm font-medium transition-colors duration-200 focus-visible:ring-2"
          >
            <Settings aria-hidden className="size-4" strokeWidth={1.75} />
            {t("shell.settings")}
          </Link>

          <div className="rounded-control text-ink-muted flex items-start gap-3 px-3 py-2.5 text-sm">
            <Bell aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
            <div className="min-w-0">
              <p className="text-ink font-medium">{t("shell.notifications")}</p>
              <p className="text-xs">{t("shell.notificationsEmpty")}</p>
            </div>
          </div>

          <SignOutButton />
        </div>
      )}

      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "rounded-control hover:bg-accent-soft focus-visible:ring-accent flex min-h-11 w-full items-center gap-3 px-2 py-1.5 text-left transition-colors duration-200 focus-visible:ring-2",
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
    </div>
  );
}
