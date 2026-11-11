import { Suspense } from "react";
import { connection } from "next/server";
import { deleteJournalAction, saveJournalAction } from "@/app/actions/journal";
import { PageShell } from "@/components/shell/page-shell";
import { PageSkeleton } from "@/components/shell/skeleton";
import { Fire } from "@/components/streak/fire";
import { requireUser } from "@/lib/auth/session";
import { env } from "@/lib/config/env";
import { JOURNAL_KINDS } from "@/lib/validation/journal";
import { t } from "@/lib/i18n";
import { getJournalForDate, getLearningStreak } from "@/lib/services/journal";
import { isValidIsoDate, localIsoDate } from "@/lib/time/local-date";

type SearchParams = Promise<{ date?: string | string[] }>;

const FIELD =
  "w-full rounded-control border border-line bg-surface-raised px-3 py-2.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-accent";

export default function JournalPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <JournalContent searchParams={searchParams} />
    </Suspense>
  );
}

async function JournalContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  await connection();

  const { date } = await searchParams;
  const today = localIsoDate(new Date(), env.DEFAULT_TIMEZONE);
  const logDate = typeof date === "string" && isValidIsoDate(date) ? date : today;

  const [entries, streak] = await Promise.all([
    getJournalForDate(user.id, logDate),
    getLearningStreak(user.id, today, env.DEFAULT_TIMEZONE),
  ]);

  return (
    <PageShell title={t("journal.title")} email={user.email}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="elevated rounded-card border-line bg-surface/85 border p-5 backdrop-blur-xl sm:p-6">
            <h2 className="mb-4 text-sm font-semibold">{t("journal.form.title")}</h2>
            <form action={saveJournalAction} className="space-y-4">
              <input type="hidden" name="logDate" value={logDate} />
              <div className="grid gap-4 sm:grid-cols-[200px_minmax(0,1fr)]">
                <label className="space-y-1.5 text-sm">
                  <span className="text-muted">{t("journal.form.kind")}</span>
                  <select name="kind" defaultValue="DAILY" className={FIELD}>
                    {JOURNAL_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {t(`journal.kind.${kind}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="text-muted">{t("journal.form.titleField")}</span>
                  <input type="text" name="title" maxLength={120} className={FIELD} />
                </label>
              </div>
              <label className="block space-y-1.5 text-sm">
                <span className="text-muted">{t("journal.form.body")}</span>
                <textarea name="body" rows={6} required maxLength={20000} className={FIELD} />
              </label>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-control bg-accent text-on-accent ease-spring px-5 py-2.5 text-sm font-medium transition-transform duration-200 active:scale-[0.97]"
                >
                  {t("journal.form.submit")}
                </button>
              </div>
            </form>
          </section>

          <section className="elevated rounded-card border-line bg-surface/85 border p-5 backdrop-blur-xl sm:p-6">
            <h2 className="mb-4 text-sm font-semibold">{t("journal.list.title")}</h2>
            {entries.length === 0 ? (
              <p className="text-muted text-sm">{t("journal.list.empty")}</p>
            ) : (
              <ul className="divide-line divide-y">
                {entries.map((entry) => (
                  <li key={entry.id} className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <p className="text-muted text-xs">
                          {t(`journal.kind.${entry.kind}`)}
                          {entry.title && ` · ${entry.title}`}
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.body}</p>
                      </div>
                      <form action={deleteJournalAction}>
                        <input type="hidden" name="entryId" value={entry.id} />
                        <button type="submit" className="text-muted hover:text-danger text-xs">
                          {t("journal.delete")}
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="elevated rounded-card border-line bg-surface/85 h-fit border p-5 backdrop-blur-xl sm:p-6">
          <h2 className="mb-4 text-sm font-semibold">{t("journal.streak.title")}</h2>
          <Fire level={streak.level} streak={streak.current} />
          <p className="text-muted mt-4 text-sm">
            {streak.todayComplete
              ? t("journal.streak.today.done")
              : t("journal.streak.today.pending")}
          </p>
          <p className="text-muted mt-2 text-sm">
            {t("journal.streak.best", { days: streak.best })}
          </p>
          {streak.lateDays > 0 && (
            <p className="text-muted mt-2 text-sm">
              {t("journal.streak.late", { count: streak.lateDays })}
            </p>
          )}
          <p className="text-muted mt-4 text-xs leading-relaxed">{t("journal.streak.hint")}</p>
        </aside>
      </div>
    </PageShell>
  );
}
