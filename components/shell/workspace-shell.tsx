"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Settings } from "lucide-react";
import { t } from "@/lib/i18n";
import type { NavSectionId } from "@/lib/nav/sections";
import { NAV_GROUPS_COOKIE, serializeFoldedGroups } from "@/lib/shell/navigation-state";
import { SIDEBAR_COOKIE, type SidebarState } from "@/lib/shell/sidebar-cookie";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Dialog } from "@/components/ui/dialog";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { WorkspaceNavbar } from "./workspace-navbar";
import { WorkspaceNavigation } from "./workspace-navigation";
import { WorkspaceBackground } from "./workspace-background";
import { SignOutButton } from "./sign-out-button";

function savePreference(name: string, value: string) {
  document.cookie = `${name}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}

export function WorkspaceShell({
  children,
  initial,
  initialFolded,
  email,
}: {
  children: ReactNode;
  initial: SidebarState;
  initialFolded: NavSectionId[];
  email: string | null;
}) {
  const [collapsed, setCollapsed] = useState(initial === "collapsed");
  const [folded, setFolded] = useState(initialFolded);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ambientPaused, setAmbientPaused] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setDrawerOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    savePreference(SIDEBAR_COOKIE, next ? "collapsed" : "expanded");
  }

  function toggleGroup(id: NavSectionId) {
    const next = folded.includes(id) ? folded.filter((entry) => entry !== id) : [...folded, id];
    setFolded(next);
    savePreference(NAV_GROUPS_COOKIE, serializeFoldedGroups(next));
  }

  return (
    <div className="workspace-shell" data-ambient-paused={ambientPaused}>
      <WorkspaceBackground />
      <a href="#main" className="workspace-skip-link">
        {t("shell.skipToContent")}
      </a>
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleSidebar}
        folded={folded}
        onFold={toggleGroup}
        email={email}
      />
      <div className="workspace-body">
        <WorkspaceNavbar
          email={email}
          onOpen={() => setDrawerOpen(true)}
          ambientPaused={ambientPaused}
          onToggleAmbient={() => setAmbientPaused((paused) => !paused)}
        />
        <main id="main" tabIndex={-1} className="workspace-main">
          {children}
        </main>
      </div>
      <MobileNav onOpen={() => setDrawerOpen(true)} />
      <Dialog
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={t("shell.navigation")}
        closeLabel={t("shell.close")}
        placement="drawer"
      >
        <div className="drawer-brand">
          <BrandLogo className="text-xl font-semibold">{t("app.short")}</BrandLogo>
        </div>
        <WorkspaceNavigation
          folded={folded}
          onFold={toggleGroup}
          onNavigate={() => setDrawerOpen(false)}
        />
        <div className="drawer-account">
          <Link href="/settings" className="navigation-link" onClick={() => setDrawerOpen(false)}>
            <Settings aria-hidden className="size-4.5" />
            {t("shell.settings")}
          </Link>
          <SignOutButton />
        </div>
      </Dialog>
    </div>
  );
}
