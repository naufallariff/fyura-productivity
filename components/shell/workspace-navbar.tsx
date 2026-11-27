"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, Search, Settings, Pause, Play } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-logo";
import { t } from "@/lib/i18n";
import { isActivePath, NAV_SECTIONS } from "@/lib/nav/sections";
import { SidebarProfile } from "./sidebar-profile";
import { openCommandPalette } from "./command-palette";

export function WorkspaceNavbar({
  email,
  onOpen,
  ambientPaused,
  onToggleAmbient,
}: {
  email: string | null;
  onOpen: () => void;
  ambientPaused: boolean;
  onToggleAmbient: () => void;
}) {
  const pathname = usePathname();
  const section = NAV_SECTIONS.find((group) =>
    group.items.some((item) => isActivePath(pathname, item.href)),
  );
  const item = section?.items.find((entry) => isActivePath(pathname, entry.href));
  return (
    <header className="workspace-navbar">
      <div className="navbar-location">
        <button
          type="button"
          className="shell-icon-button navbar-mobile-menu"
          onClick={onOpen}
          aria-label={t("shell.openNavigation")}
          aria-haspopup="dialog"
        >
          <Menu aria-hidden className="size-5" />
        </button>
        <BrandMark className="brand-mark navbar-mobile-brand size-7" />
        <span className="navbar-section">{section ? t(section.labelKey) : t("app.short")}</span>
        <ChevronRight aria-hidden className="navbar-chevron size-3.5" />
        <span className="navbar-page">{item ? t(item.labelKey) : t("shell.settings")}</span>
      </div>
      <div className="navbar-actions">
        <button
          type="button"
          className="shell-icon-button"
          onClick={openCommandPalette}
          aria-label={t("shell.palette.title")}
          aria-haspopup="dialog"
          title={t("shell.palette.title")}
        >
          <Search aria-hidden className="size-4.5" />
        </button>
        <button
          type="button"
          className="shell-icon-button ambient-toggle"
          onClick={onToggleAmbient}
          aria-pressed={ambientPaused}
          aria-label={ambientPaused ? t("shell.ambient.resume") : t("shell.ambient.pause")}
          title={ambientPaused ? t("shell.ambient.resume") : t("shell.ambient.pause")}
        >
          {ambientPaused ? (
            <Play aria-hidden className="size-4" />
          ) : (
            <Pause aria-hidden className="size-4" />
          )}
        </button>
        <Link
          href="/settings"
          className="shell-icon-button navbar-settings"
          aria-label={t("shell.settings")}
          title={t("shell.settings")}
        >
          <Settings aria-hidden className="size-4.5" />
        </Link>
        <div className="navbar-avatar">
          <SidebarProfile email={email} collapsed placement="below" />
        </div>
      </div>
    </header>
  );
}
