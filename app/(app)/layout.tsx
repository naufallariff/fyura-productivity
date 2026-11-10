import { Suspense } from "react";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth/session";
import { parseSidebarState, SIDEBAR_COOKIE } from "@/lib/shell/sidebar-cookie";
import { Sidebar } from "@/components/shell/sidebar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { PageSkeleton } from "@/components/shell/skeleton";

async function ShellFrame({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const jar = await cookies();
  const sidebar = parseSidebarState(jar.get(SIDEBAR_COOKIE)?.value);

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="focus:rounded-control focus:bg-accent focus:text-on-accent sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <Sidebar initial={sidebar} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main" className="flex-1 pb-28 md:pb-10">
          {children}
        </main>
      </div>
      <MobileNav />
      <span hidden>{user.email}</span>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ShellFrame>{children}</ShellFrame>
    </Suspense>
  );
}
