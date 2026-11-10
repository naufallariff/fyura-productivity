import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesColumn,
  CircleCheck,
  FolderKanban,
  Gauge,
  Lock,
  NotebookPen,
  Settings,
  Sparkles,
  Timer,
  BookText,
  Lightbulb,
} from "lucide-react";

export type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom bar. Only four items may have this set. */
  primary?: boolean;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: Gauge, primary: true },
  { href: "/today", labelKey: "nav.today", icon: CalendarDays, primary: true },
  { href: "/focus", labelKey: "nav.focus", icon: Timer, primary: true },
  { href: "/capture", labelKey: "nav.capture", icon: Lightbulb, primary: true },
  { href: "/plan", labelKey: "nav.plan", icon: NotebookPen },
  { href: "/habits", labelKey: "nav.habits", icon: CircleCheck },
  { href: "/projects", labelKey: "nav.projects", icon: FolderKanban },
  { href: "/career", labelKey: "nav.career", icon: BriefcaseBusiness },
  { href: "/learning", labelKey: "nav.learning", icon: BookOpen },
  { href: "/tadabur", labelKey: "nav.tadabur", icon: Sparkles },
  { href: "/journal", labelKey: "nav.journal", icon: BookText },
  { href: "/calendar", labelKey: "nav.calendar", icon: CalendarDays },
  { href: "/review", labelKey: "nav.review", icon: ChartNoAxesColumn },
  { href: "/private", labelKey: "nav.private", icon: Lock },
  { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

export const PRIMARY_NAV = NAV_ITEMS.filter((item) => item.primary);
export const SECONDARY_NAV = NAV_ITEMS.filter((item) => !item.primary);

/** Active when the pathname equals the href or is nested under it. */
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
