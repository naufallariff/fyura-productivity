"use client";

import { PanelLeftClose, Search } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { BrandLogo, BrandMark } from "@/components/brand/brand-logo";
import { t } from "@/lib/i18n";
import type { NavSectionId } from "@/lib/nav/sections";
import { SidebarProfile } from "./sidebar-profile";
import { WorkspaceNavigation } from "./workspace-navigation";
import { openCommandPalette } from "./command-palette";

export function Sidebar({
  collapsed,
  onToggle,
  folded,
  onFold,
  email,
}: {
  collapsed: boolean;
  onToggle: () => void;
  folded: readonly NavSectionId[];
  onFold: (id: NavSectionId) => void;
  email: string | null;
}) {
  const toggleRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);

  useLayoutEffect(() => {
    if (restoreFocus.current) {
      toggleRef.current?.focus();
      restoreFocus.current = false;
    }
  }, [collapsed]);

  function toggle() {
    restoreFocus.current = true;
    onToggle();
  }

  return (
    <aside className="workspace-sidebar" data-collapsed={collapsed} aria-label={t("shell.sidebar")}>
      <div className="sidebar-glass">
        <div className="sidebar-brand">
          {collapsed ? (
            <button
              ref={toggleRef}
              type="button"
              className="brand-expand"
              onClick={toggle}
              aria-label={t("shell.expand")}
              aria-expanded={false}
              title={t("shell.expand")}
            >
              <BrandMark className="brand-mark size-10" />
            </button>
          ) : (
            <>
              <BrandLogo className="text-xl font-semibold">{t("app.short")}</BrandLogo>
              <button
                ref={toggleRef}
                type="button"
                className="shell-icon-button"
                onClick={toggle}
                aria-label={t("shell.collapse")}
                aria-expanded
                title={t("shell.collapse")}
              >
                <PanelLeftClose aria-hidden className="size-4.5" strokeWidth={1.7} />
              </button>
            </>
          )}
        </div>
        <button
          type="button"
          className="sidebar-search"
          onClick={openCommandPalette}
          aria-label={t("shell.palette.title")}
          aria-haspopup="dialog"
          aria-keyshortcuts="Meta+K Control+K"
          title={collapsed ? t("shell.palette.title") : undefined}
        >
          <Search aria-hidden className="size-4.5 shrink-0" />
          {!collapsed && (
            <>
              <span>{t("shell.palette.title")}</span>
              <kbd aria-hidden>Ctrl K</kbd>
            </>
          )}
        </button>
        <WorkspaceNavigation collapsed={collapsed} folded={folded} onFold={onFold} />
        <div className="sidebar-account">
          <SidebarProfile email={email} collapsed={collapsed} />
        </div>
      </div>
    </aside>
  );
}
