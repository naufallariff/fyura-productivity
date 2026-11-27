"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useLayoutEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { t } from "@/lib/i18n";
import { isActivePath, NAV_SECTIONS, WORKSPACE_VIEWS, type NavSectionId } from "@/lib/nav/sections";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";

export function WorkspaceNavigation({
  collapsed = false,
  folded,
  onFold,
  onNavigate,
}: {
  collapsed?: boolean;
  folded: readonly NavSectionId[];
  onFold: (id: NavSectionId) => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const membrane = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const content = root.current;
    const layer = membrane.current;
    if (!content || !layer) return;
    const position = () => {
      const active = content.querySelector<HTMLElement>('[aria-current="page"]');
      if (!active || active.getClientRects().length === 0 || active.closest("[inert]")) {
        layer.style.opacity = "0";
        return;
      }
      const bounds = content.getBoundingClientRect();
      const target = active.getBoundingClientRect();
      layer.style.height = `${target.height + 16}px`;
      layer.style.transform = `translateY(${target.top - bounds.top - 8}px)`;
      layer.style.opacity = "1";
    };
    position();
    const observer = new ResizeObserver(position);
    observer.observe(content);
    return () => observer.disconnect();
  }, [pathname, collapsed, folded]);

  return (
    <nav
      aria-label={t("nav.primaryLabel")}
      className="workspace-navigation"
      data-icons-only={collapsed}
    >
      <TooltipProvider>
        <div ref={root} className="navigation-content">
          <span ref={membrane} aria-hidden className="navigation-membrane">
            <svg viewBox="0 0 240 60" preserveAspectRatio="none" fill="none">
              <path d="M0 0C20 0 14 10 34 10L212 10C228 10 240 18 240 30C240 42 228 50 212 50L34 50C14 50 20 60 0 60Z" />
            </svg>
          </span>
          {NAV_SECTIONS.map((section) => {
            const closed = !collapsed && folded.includes(section.id);
            const activeGroup = section.items.some((item) => isActivePath(pathname, item.href));
            const groupId = `${id}-${section.id}`;
            return (
              <section
                key={section.id}
                className="navigation-section"
                data-active-group={activeGroup}
              >
                {collapsed ? (
                  <span className="navigation-divider" aria-hidden />
                ) : (
                  <button
                    type="button"
                    className="navigation-heading"
                    aria-expanded={!closed}
                    aria-controls={groupId}
                    onClick={() => onFold(section.id)}
                  >
                    <span>{t(section.labelKey)}</span>
                    <ChevronDown aria-hidden className="size-3.5" data-folded={closed} />
                  </button>
                )}
                <div className="navigation-disclosure" data-folded={closed} inert={closed}>
                  <div className="navigation-disclosure-inner">
                    <ul id={groupId} className="navigation-list">
                      {section.items.map((item) => {
                        const active = isActivePath(pathname, item.href);
                        const Icon = item.icon;
                        const label = t(item.labelKey);
                        const shortcut = WORKSPACE_VIEWS.find(
                          (view) => view.href === item.href,
                        )?.shortcut;
                        const link = (
                          <Link
                            href={item.href}
                            className="navigation-link"
                            aria-label={collapsed ? label : undefined}
                            aria-current={active ? "page" : undefined}
                            aria-keyshortcuts={shortcut ? `Alt+Shift+${shortcut}` : undefined}
                            onClick={onNavigate}
                          >
                            <span className="navigation-icon">
                              <Icon aria-hidden className="size-4.5" strokeWidth={1.7} />
                            </span>
                            {!collapsed && <span className="navigation-label">{label}</span>}
                            {active && !collapsed && (
                              <span aria-hidden className="navigation-active-dot" />
                            )}
                          </Link>
                        );
                        return (
                          <li key={item.href}>
                            {collapsed ? (
                              <Tooltip
                                text={label}
                                shortcut={
                                  shortcut ? t("shell.navShortcut", { key: shortcut }) : undefined
                                }
                              >
                                {link}
                              </Tooltip>
                            ) : (
                              link
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </TooltipProvider>
    </nav>
  );
}
