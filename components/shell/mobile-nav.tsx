"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Ellipsis, X } from "lucide-react";
import { PRIMARY_NAV, SECONDARY_NAV, isActivePath } from "@/lib/nav/items";
import { t } from "@/lib/i18n";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sheet = useRef<HTMLDialogElement>(null);

  // Sync the native dialog with React state. This is an external system (the DOM).
  useEffect(() => {
    const dialog = sheet.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <nav
        aria-label={t("nav.primaryLabel")}
        className="elevated rounded-card border-line bg-surface fixed inset-x-3 bottom-3 z-40 flex items-center justify-around border p-2 md:hidden"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {PRIMARY_NAV.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-control ease-spring flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 px-2 text-[11px] font-medium transition-transform duration-200 active:scale-95 ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <Icon aria-hidden className="size-5" strokeWidth={1.75} />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="rounded-control text-muted ease-spring flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 px-2 text-[11px] font-medium transition-transform duration-200 active:scale-95"
        >
          <Ellipsis aria-hidden className="size-5" strokeWidth={1.75} />
          <span>{t("nav.more")}</span>
        </button>
      </nav>

      <dialog
        ref={sheet}
        onClose={() => setOpen(false)}
        aria-label={t("nav.more")}
        className="border-line bg-surface text-text m-0 mt-auto w-full max-w-none rounded-t-[28px] border-x-0 border-t border-b-0 p-6 backdrop:bg-black/40 md:hidden"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{t("nav.more")}</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("shell.close")}
            className="bg-surface-raised text-muted grid size-9 place-items-center rounded-full"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
        <ul className="grid grid-cols-3 gap-3 pb-4">
          {SECONDARY_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-card border-line bg-surface-raised flex flex-col items-center gap-2 border p-4 text-center text-xs font-medium"
                >
                  <Icon aria-hidden className="text-accent size-5" strokeWidth={1.75} />
                  <span>{t(item.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </dialog>
    </>
  );
}
