import type { LucideIcon } from "lucide-react";
import {
  BookText,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  Columns3,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  Lock,
  Settings,
} from "lucide-react";

export type NavSectionId = "main" | "workspace" | "private";

export interface NavItem {
  readonly href: string;
  readonly labelKey: string;
  readonly icon: LucideIcon;
  /** Shown in the mobile bottom bar. Exactly four items carry this flag. */
  readonly mobilePrimary: boolean;
}

export interface NavSection {
  readonly id: NavSectionId;
  readonly labelKey: string;
  readonly items: readonly NavItem[];
}

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    id: "main",
    labelKey: "nav.sectionMain",
    items: [
      { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard, mobilePrimary: true },
      {
        href: "/daily-tracker",
        labelKey: "nav.dailyTracker",
        icon: Clock3,
        mobilePrimary: true,
      },
      { href: "/projects", labelKey: "nav.projects", icon: Columns3, mobilePrimary: true },
      { href: "/weekly-plan", labelKey: "nav.weeklyPlan", icon: CalendarDays, mobilePrimary: true },
    ],
  },
  {
    id: "workspace",
    labelKey: "nav.sectionWorkspace",
    items: [
      { href: "/career", labelKey: "nav.career", icon: BriefcaseBusiness, mobilePrimary: false },
      { href: "/learning", labelKey: "nav.learning", icon: GraduationCap, mobilePrimary: false },
      { href: "/journal", labelKey: "nav.journal", icon: BookText, mobilePrimary: false },
      { href: "/capture", labelKey: "nav.capture", icon: Lightbulb, mobilePrimary: false },
    ],
  },
  {
    id: "private",
    labelKey: "nav.sectionPrivate",
    items: [{ href: "/private", labelKey: "nav.private", icon: Lock, mobilePrimary: false }],
  },
];

export const NAV_ITEMS: readonly NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);
export const MOBILE_PRIMARY: readonly NavItem[] = NAV_ITEMS.filter((item) => item.mobilePrimary);

export const WORKSPACE_VIEWS = [
  ...NAV_ITEMS,
  { href: "/settings", labelKey: "shell.settings", icon: Settings, mobilePrimary: false },
].map((item, index) => ({ ...item, shortcut: String((index + 1) % 10) }));

/** Active when the pathname equals the href or sits under it at a path boundary. */
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
