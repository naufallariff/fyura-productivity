"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { t } from "@/lib/i18n";
import { isActivePath, MOBILE_PRIMARY } from "@/lib/nav/sections";

const COMPACT_LABELS: Record<string, string> = {
  "/dashboard": "shell.home",
  "/daily-tracker": "shell.daily",
  "/weekly-plan": "shell.weekly",
};

export function MobileNav({ onOpen }: { onOpen: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="mobile-dock" aria-label={t("nav.primaryLabel")}>
      {MOBILE_PRIMARY.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="mobile-dock-link"
            aria-label={t(item.labelKey)}
            aria-current={active ? "page" : undefined}
          >
            <span className="mobile-dock-icon">
              <Icon aria-hidden className="size-5" strokeWidth={1.7} />
            </span>
            <span className="truncate">{t(COMPACT_LABELS[item.href] ?? item.labelKey)}</span>
          </Link>
        );
      })}
      <button
        type="button"
        className="mobile-dock-link"
        onClick={onOpen}
        aria-label={t("shell.openNavigation")}
        aria-haspopup="dialog"
      >
        <span className="mobile-dock-icon">
          <Menu aria-hidden className="size-5" strokeWidth={1.7} />
        </span>
        <span>{t("shell.more")}</span>
      </button>
    </nav>
  );
}
