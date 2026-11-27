"use client";

import { useState, type ReactNode } from "react";
import {
  Search,
  Bell,
  PanelLeftClose,
  ChevronDown,
  LayoutGrid,
  CalendarDays,
  CalendarRange,
  Kanban,
  Briefcase,
  Wallet,
  TrendingUp,
  Target,
  NotebookPen,
  BookOpen,
  GraduationCap,
  Lightbulb,
  BookOpenText,
  Shield,
  Lock,
  Mail,
  Calendar,
  Settings,
  UserRound,
  Menu,
} from "lucide-react";
import { BrandMark } from "@/components/brand/brand-logo";
import { IconButton, Modal } from "@/components/ui/workspace-controls";
import { dailyLabel, navigation } from "@/data/navigation";

const icons = [
  CalendarDays,
  CalendarRange,
  Kanban,
  Briefcase,
  Wallet,
  TrendingUp,
  Target,
  NotebookPen,
  BookOpen,
  GraduationCap,
  Lightbulb,
  BookOpenText,
  Shield,
  Lock,
  Mail,
  Calendar,
];
const labels = navigation.flatMap<string>((group) => [...group.items]);
const iconMap = new Map(labels.map((label, index) => [label, icons[index]] as const));
const searchable = [
  "Dashboard",
  ...navigation
    .filter((group) => group.label !== "Private room")
    .flatMap<string>((group) => [...group.items]),
  "Settings",
];

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [closed, setClosed] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>(dailyLabel);
  const [dialog, setDialog] = useState<"Search" | "Notifications" | "Account" | null>(null);
  const [query, setQuery] = useState("");

  function select(label: string) {
    setSelected(label);
    setDialog(null);
    setDrawer(false);
  }

  function row(label: string) {
    const Icon = iconMap.get(label) ?? (label === "Settings" ? Settings : LayoutGrid);
    return (
      <button
        key={label}
        className="nav-row"
        title={label}
        aria-current={selected === label ? "page" : undefined}
        onClick={() => select(label)}
      >
        <Icon size={18} aria-hidden="true" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <div className={`workspace ${collapsed ? "is-collapsed" : ""} ${drawer ? "drawer-open" : ""}`}>
      <div className="prism-field" aria-hidden="true">
        <i />
        <i />
      </div>
      {drawer && (
        <button
          className="drawer-scrim"
          aria-label="Close navigation"
          onClick={() => setDrawer(false)}
        />
      )}
      <aside className="rail">
        <div className="rail-head">
          <button
            className="logo-control"
            aria-label={collapsed ? "Expand sidebar" : "Daily tracker"}
            onClick={() => (collapsed ? setCollapsed(false) : select(dailyLabel))}
          >
            <BrandMark width={40} height={40} />
          </button>
          <IconButton
            label="Collapse sidebar"
            onClick={() => {
              setCollapsed(true);
              setDrawer(false);
            }}
          >
            <PanelLeftClose size={19} />
          </IconButton>
        </div>
        <nav aria-label="Workspace">
          {row("Dashboard")}
          {navigation.map(({ label, items }) => {
            const open = !closed.includes(label) || collapsed;
            return (
              <section className="nav-group" key={label}>
                <button
                  className="group-control"
                  aria-expanded={open}
                  onClick={() =>
                    setClosed((previous) =>
                      open ? [...previous, label] : previous.filter((item) => item !== label),
                    )
                  }
                >
                  <span>{label}</span>
                  <ChevronDown size={14} />
                </button>
                <div className="nav-reveal" data-open={open} inert={!open}>
                  <div>{items.map(row)}</div>
                </div>
              </section>
            );
          })}
          {row("Settings")}
        </nav>
      </aside>
      <div className="workspace-body">
        <header className="navbar">
          <IconButton
            label="Search"
            onClick={() => {
              setQuery("");
              setDialog("Search");
            }}
          >
            <Search size={20} />
          </IconButton>
          <IconButton label="Notifications" onClick={() => setDialog("Notifications")}>
            <Bell size={20} />
          </IconButton>
          <button className="avatar" aria-label="Account" onClick={() => setDialog("Account")}>
            <UserRound size={19} />
          </button>
        </header>
        <main id="main-content">
          <div hidden={selected !== dailyLabel}>{children}</div>
          {selected !== dailyLabel && (
            <section className="panel unavailable">
              <h1>{selected}</h1>
              <p>This page is not part of the current preview.</p>
              <button className="primary" onClick={() => select(dailyLabel)}>
                Back to Daily tracker
              </button>
            </section>
          )}
        </main>
      </div>
      <div className="mobile-dock">
        <IconButton
          label="Open navigation"
          aria-expanded={drawer}
          onClick={() => setDrawer(!drawer)}
        >
          <Menu />
        </IconButton>
        <IconButton label="Daily tracker" onClick={() => select(dailyLabel)}>
          <CalendarDays />
        </IconButton>
      </div>
      {dialog && (
        <Modal title={dialog} onClose={() => setDialog(null)}>
          {dialog === "Search" && (
            <div className="search-results">
              <input
                autoFocus
                aria-label="Search pages"
                placeholder="Find a page"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {searchable
                .filter((label) => label.toLowerCase().includes(query.trim().toLowerCase()))
                .map(row)}
              {!searchable.some((label) =>
                label.toLowerCase().includes(query.trim().toLowerCase()),
              ) && <p>No matching pages.</p>}
            </div>
          )}
          {dialog === "Notifications" && <p>You’re all caught up.</p>}
          {dialog === "Account" && (
            <>
              <p>Personal workspace · Local preview</p>
              <button onClick={() => select("Settings")}>Settings</button>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
