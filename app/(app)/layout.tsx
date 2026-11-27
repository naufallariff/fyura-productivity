import { Suspense } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { CommandPalette } from "@/components/shell/command-palette";
import { PageSkeleton } from "@/components/ui/skeleton";
import { NAV_GROUPS_COOKIE, parseFoldedGroups } from "@/lib/shell/navigation-state";
import { parseSidebarState, SIDEBAR_COOKIE } from "@/lib/shell/sidebar-cookie";
import { requireUser } from "@/server/auth/session";

async function ShellFrame({ children }: { children: React.ReactNode }) {
  // requireUser() calls connection() first, so auth never runs during prerendering.
  await connection();
  const user = await requireUser();
  const jar = await cookies();
  const sidebar = parseSidebarState(jar.get(SIDEBAR_COOKIE)?.value);

  return (
    <WorkspaceShell
      initial={sidebar}
      initialFolded={parseFoldedGroups(jar.get(NAV_GROUPS_COOKIE)?.value)}
      email={user.email}
    >
      {children}
      <CommandPalette />
    </WorkspaceShell>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ShellFrame>{children}</ShellFrame>
    </Suspense>
  );
}
