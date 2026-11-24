"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Ellipsis } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { t } from "@/lib/i18n";
import { isActivePath, MOBILE_PRIMARY, NAV_SECTIONS } from "@/lib/nav/sections";
import { cn } from "@/lib/ui/cn";
import { SignOutButton } from "./sign-out-button";

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const secondary = NAV_SECTIONS.filter((section) => section.id !== "main");

  return (
    <>
      <nav
        aria-label={t("nav.primaryLabel")}
        data-glass-permitted
        className="glass fixed inset-x-3 bottom-3 z-40 flex items-stretch gap-1 rounded-full p-2 md:hidden"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {MOBILE_PRIMARY.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "ease-spring flex min-h-12 min-w-14 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition-transform duration-200 motion-safe:active:scale-95",
                active ? "text-accent" : "text-ink-muted",
              )}
            >
              <Icon aria-hidden className="size-5" strokeWidth={1.75} />
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => setMoreOpen(true)}
          className="text-ink-muted ease-spring flex min-h-12 min-w-14 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition-transform duration-200 motion-safe:active:scale-95"
        >
          <Ellipsis aria-hidden className="size-5" strokeWidth={1.75} />
          <span>{t("shell.more")}</span>
        </button>
      </nav>

      <Dialog
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title={t("shell.more")}
        closeLabel={t("shell.close")}
      >
        <div className="space-y-6">
          {secondary.map((section) => (
            <section key={section.id} className="space-y-2">
              <h3 className="text-ink-muted text-xs font-medium tracking-widest uppercase">
                {t(section.labelKey)}
              </h3>
              <ul className="grid grid-cols-2 gap-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className="border-line text-ink hover:bg-accent-soft flex min-h-12 items-center gap-3 rounded-lg border bg-(--bg-surface) p-3 text-sm font-medium transition-colors duration-200"
                      >
                        <Icon aria-hidden className="size-4.5 shrink-0" strokeWidth={1.75} />
                        <span className="truncate">{t(item.labelKey)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <div className="border-line space-y-1 border-t pt-4">
            <Link
              href="/settings"
              onClick={() => setMoreOpen(false)}
              className="text-ink-muted hover:bg-accent-soft hover:text-ink flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium"
            >
              {t("shell.settings")}
            </Link>
            <SignOutButton />
          </div>
        </div>
      </Dialog>
    </>
  );
}
