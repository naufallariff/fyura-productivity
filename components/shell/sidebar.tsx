"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { t } from "@/lib/i18n";
import { isActivePath, NAV_SECTIONS, type NavItem } from "@/lib/nav/sections";
import { SIDEBAR_COOKIE, type SidebarState } from "@/lib/shell/sidebar-cookie";
import { cn } from "@/lib/ui/cn";
import { SidebarProfile } from "./sidebar-profile";

export function Sidebar({ initial, email }: { initial: SidebarState; email: string | null }) {
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
      className={cn(
        "ease-spring sticky top-0 hidden h-dvh shrink-0 p-3 transition-[width] duration-300 md:flex",
        collapsed ? "w-22" : "w-68",
      )}
    >
      <div className="glass flex h-full w-full flex-col gap-4 p-3">
        <div
          className={cn("flex h-11 items-center gap-3 px-2", collapsed && "justify-center px-0")}
        >
          <span className="rounded-control bg-accent text-on-accent grid size-9 shrink-0 place-items-center text-sm font-semibold">
            F
          </span>
          {!collapsed && <span className="truncate text-sm font-semibold">{t("app.short")}</span>}
        </div>

        <nav
          aria-label={t("nav.primaryLabel")}
          className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto"
        >
          {NAV_SECTIONS.map((section) => (
            <div key={section.id} className="space-y-1">
              {!collapsed && (
                <p className="text-ink-muted px-3 text-[11px] font-medium tracking-widest uppercase">
                  {t(section.labelKey)}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      item={item}
                      active={isActivePath(pathname, item.href)}
                      collapsed={collapsed}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-line space-y-2 border-t pt-3">
          <SidebarProfile email={email} collapsed={collapsed} />
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? t("shell.expand") : t("shell.collapse")}
            title={collapsed ? t("shell.expand") : t("shell.collapse")}
            className="rounded-control text-ink-muted hover:bg-accent-soft hover:text-ink focus-visible:ring-accent flex min-h-11 w-full items-center justify-center transition-colors duration-200 focus-visible:ring-2"
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden className="size-4.5" strokeWidth={1.75} />
            ) : (
              <PanelLeftClose aria-hidden className="size-4.5" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const label = t(item.labelKey);

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "rounded-control focus-visible:ring-accent flex min-h-11 items-center gap-3 px-3 text-sm font-medium transition-colors duration-200 focus-visible:ring-2",
        active ? "bg-accent text-on-accent" : "text-ink-muted hover:bg-accent-soft hover:text-ink",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon aria-hidden className="size-4.5 shrink-0" strokeWidth={1.75} />
      <span className={cn("truncate", collapsed && "sr-only")}>{label}</span>
    </Link>
  );
}
