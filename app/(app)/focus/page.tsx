import { Suspense } from "react";
import { connection } from "next/server";
import { PageShell } from "@/components/shell/page-shell";
import { PageSkeleton } from "@/components/shell/skeleton";
import { FocusTimer } from "@/components/focus/timer";
import { requireUser } from "@/lib/auth/session";
import { env } from "@/lib/config/env";
import { t } from "@/lib/i18n";
import { recentFocusSessions } from "@/lib/services/focus";
import { localIsoDate } from "@/lib/time/local-date";

export default function FocusPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <FocusContent />
    </Suspense>
  );
}

async function FocusContent() {
  const user = await requireUser();
  await connection();
  const today = localIsoDate(new Date(), env.DEFAULT_TIMEZONE);
  const recent = await recentFocusSessions(user.id, 8);

  return (
    <PageShell title={t("focus.title")} email={user.email}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section
          data-focus-keep
          className="elevated rounded-card border-line bg-surface/85 border p-8 backdrop-blur-xl"
        >
          <FocusTimer logDate={today} timeZone={env.DEFAULT_TIMEZONE} />
        </section>

        <section className="elevated rounded-card border-line bg-surface/85 border p-6 backdrop-blur-xl">
          <h2 className="mb-4 text-sm font-semibold">{t("focus.recent.title")}</h2>
          {recent.length === 0 ? (
            <p className="text-muted text-sm">{t("focus.recent.empty")}</p>
          ) : (
            <ul className="divide-line divide-y">
              {recent.map((session) => (
                <li key={session.id} className="flex items-center justify-between py-3 text-sm">
                  <span>
                    {session.kind === "DEEP" ? t("focus.kind.deep") : t("focus.kind.light")} ·{" "}
                    {t("focus.minutes", { minutes: session.plannedMinutes })}
                  </span>
                  <span className="text-muted tabular-nums">
                    {session.completed ? t("focus.recent.completed") : t("focus.recent.stopped")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}
