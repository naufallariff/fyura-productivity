import { Suspense } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { Sidebar } from "@/components/shell/sidebar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { PageSkeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";
import { parseSidebarState, SIDEBAR_COOKIE } from "@/lib/shell/sidebar-cookie";
import { requireUser } from "@/server/auth/session";

async function ShellFrame({ children }: { children: React.ReactNode }) {
  // requireUser() calls connection() first, so auth never runs during prerendering.
  await connection();
  const user = await requireUser();
  const jar = await cookies();
  const sidebar = parseSidebarState(jar.get(SIDEBAR_COOKIE)?.value);

  return (
    <div className="flex min-h-dvh gap-0">
      <a
        href="#main"
        className="focus:rounded-control focus:bg-accent focus:text-on-accent sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2"
      >
        {t("shell.skipToContent")}
      </a>
      <Sidebar initial={sidebar} email={user.email} />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <main id="main" className="flex-1 pb-28 md:pb-10">
          {children}
        </main>
      </div>
      <MobileNav />
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
