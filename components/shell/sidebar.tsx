"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { t } from "@/lib/i18n";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { isActivePath, NAV_SECTIONS, WORKSPACE_VIEWS, type NavItem } from "@/lib/nav/sections";
import { SIDEBAR_COOKIE, type SidebarState } from "@/lib/shell/sidebar-cookie";
import { cn } from "@/lib/ui/cn";
import { SidebarProfile } from "./sidebar-profile";
import { openCommandPalette } from "./command-palette";

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
        "sticky top-0 z-30 hidden h-dvh shrink-0 py-3 md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-y-3 left-0 w-64 overflow-clip">
        <div data-glass-permitted className="glass sidebar-panel h-full w-full rounded-r-2xl" />
      </div>
      <div className="relative flex h-full w-full min-w-0 flex-col gap-3 p-2">
        <div className="flex h-11 shrink-0 items-center gap-2">
          <span className="bg-accent text-on-accent mx-1.5 grid size-9 shrink-0 place-items-center rounded-lg text-sm font-semibold">
            F
          </span>
          {!collapsed && <span className="truncate text-sm font-semibold">{t("app.short")}</span>}
        </div>

        <button
          type="button"
          aria-haspopup="dialog"
          aria-label={t("shell.palette.title")}
          aria-keyshortcuts="Meta+K Control+K"
          onClick={openCommandPalette}
          className="text-ink-muted hover:bg-accent-soft hover:text-ink flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-lg pr-2 text-sm font-medium"
        >
          <span className="grid h-11 w-12 shrink-0 place-items-center">
            <Search aria-hidden className="size-4.5" />
          </span>
          {!collapsed && <span className="truncate">{t("shell.palette.title")}</span>}
        </button>

        <nav
          aria-label={t("nav.primaryLabel")}
          className="sidebar-nav flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto"
        >
          <TooltipProvider>
            {NAV_SECTIONS.map((section) => (
              <div key={section.id} className="space-y-1">
                <p
                  className={cn(
                    "text-ink-muted h-4 truncate px-3 text-xs font-medium uppercase",
                    collapsed && "invisible",
                  )}
                >
                  {t(section.labelKey)}
                </p>
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
          </TooltipProvider>
        </nav>

        <div className="border-line space-y-2 border-t pt-3">
          <SidebarProfile email={email} collapsed={collapsed} />
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? t("shell.expand") : t("shell.collapse")}
            title={collapsed ? t("shell.expand") : t("shell.collapse")}
            className="text-ink-muted hover:bg-accent-soft hover:text-ink focus-visible:ring-accent flex min-h-11 w-full items-center justify-center rounded-lg transition-colors duration-200 focus-visible:ring-2"
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

  const shortcut = WORKSPACE_VIEWS.find((view) => view.href === item.href)?.shortcut;
  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-keyshortcuts={shortcut ? `Alt+Shift+${shortcut}` : undefined}
      className={cn(
        "focus-visible:ring-accent flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium focus-visible:ring-2 focus-visible:ring-inset",
        active ? "bg-accent text-on-accent" : "text-ink-muted hover:bg-accent-soft hover:text-ink",
      )}
    >
      <span className="grid h-11 w-12 shrink-0 place-items-center">
        <Icon aria-hidden className="size-4.5" strokeWidth={1.75} />
      </span>
      <span className={cn("truncate", collapsed && "sr-only")}>{label}</span>
    </Link>
  );

  return collapsed ? (
    <Tooltip
      text={label}
      shortcut={shortcut ? t("shell.navShortcut", { key: shortcut }) : undefined}
    >
      {link}
    </Tooltip>
  ) : (
    link
  );
}
