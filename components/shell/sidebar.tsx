"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { NAV_ITEMS, isActivePath } from "@/lib/nav/items";
import { SIDEBAR_COOKIE, type SidebarState } from "@/lib/shell/sidebar-cookie";
import { signOutAction } from "@/app/actions/auth";
import { t } from "@/lib/i18n";

export function Sidebar({ initial }: { initial: SidebarState }) {
  const pathname = usePathname();
  const [state, setState] = useState<SidebarState>(initial);
  const collapsed = state === "collapsed";

  const toggle = () => {
    const next: SidebarState = collapsed ? "expanded" : "collapsed";
    setState(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <aside
      data-collapsed={collapsed}
      className="border-line bg-surface ease-spring sticky top-0 hidden h-dvh shrink-0 flex-col border-r transition-[width] duration-300 data-[collapsed=false]:w-60 data-[collapsed=true]:w-18 md:flex"
    >
      <div className="flex h-16 items-center gap-3 px-4">
        <span className="bg-accent text-on-accent grid size-9 shrink-0 place-items-center rounded-xl text-sm font-semibold">
          F
        </span>
        {!collapsed && (
          <span className="truncate text-[15px] font-semibold tracking-[-0.01em]">
            {t("app.short")}
          </span>
        )}
      </div>

      <nav
        aria-label={t("nav.sidebarLabel")}
        className="flex-1 space-y-1 overflow-y-auto px-3 py-2"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          const label = t(item.labelKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? label : undefined}
              className={`rounded-control flex h-10 items-center gap-3 px-3 text-sm transition-colors duration-200 ${
                active
                  ? "bg-accent text-on-accent"
                  : "text-muted hover:bg-surface-raised hover:text-text"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon aria-hidden className="size-4.5 shrink-0" strokeWidth={1.75} />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-line space-y-1 border-t p-3">
        <form action={signOutAction}>
          <button
            type="submit"
            suppressHydrationWarning
            title={collapsed ? t("shell.signOut") : undefined}
            className="rounded-control text-muted hover:bg-surface-raised hover:text-text flex h-10 w-full items-center gap-3 px-3 text-sm transition-colors"
          >
            <LogOut aria-hidden className="size-4.5 shrink-0" strokeWidth={1.75} />
            {!collapsed && <span>{t("shell.signOut")}</span>}
          </button>
        </form>
        <button
          type="button"
          onClick={toggle}
          suppressHydrationWarning
          aria-label={collapsed ? t("nav.expand") : t("nav.collapse")}
          className="rounded-control text-muted hover:bg-surface-raised hover:text-text flex h-10 w-full items-center justify-center transition-colors"
        >
          {collapsed ? (
            <ChevronsRight aria-hidden className="size-4.5" />
          ) : (
            <ChevronsLeft aria-hidden className="size-4.5" />
          )}
        </button>
      </div>
    </aside>
  );
}
