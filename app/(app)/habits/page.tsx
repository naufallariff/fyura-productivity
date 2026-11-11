import { Suspense } from "react";
import { connection } from "next/server";
import { setHabitCheckAction } from "@/app/actions/habits";
import { PageShell } from "@/components/shell/page-shell";
import { PageSkeleton } from "@/components/shell/skeleton";
import { requireUser } from "@/lib/auth/session";
import { env } from "@/lib/config/env";
import { t } from "@/lib/i18n";
import { getHabitBoard } from "@/lib/services/daily";
import { localIsoDate } from "@/lib/time/local-date";

export default function HabitsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HabitsContent />
    </Suspense>
  );
}

async function HabitsContent() {
  const user = await requireUser();
  await connection();

  const today = localIsoDate(new Date(), env.DEFAULT_TIMEZONE);
  const board = await getHabitBoard(user.id, today);

  return (
    <PageShell title={t("habits.title")} email={user.email}>
      <section className="elevated rounded-card border-line bg-surface border p-5 sm:p-6">
        <header className="mb-4 space-y-1">
          <h2 className="text-sm font-semibold">{t("habits.board.title")}</h2>
          <p className="text-muted text-xs leading-relaxed">{t("habits.board.hint")}</p>
        </header>

        <ul className="divide-line divide-y">
          {board.map((habit) => {
            const sourceText =
              habit.source === "BLOCK"
                ? t("habits.source.block")
                : habit.source === "MANUAL"
                  ? t("habits.source.manual")
                  : t("habits.source.none");

            return (
              <li key={habit.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{habit.name}</p>
                  <p className="text-muted text-xs">
                    {habit.automated ? t("habits.automated") : t("habits.manualOnly")} ·{" "}
                    {sourceText}
                  </p>
                </div>

                {habit.kind === "BINARY" ? (
                  <form action={setHabitCheckAction}>
                    <input type="hidden" name="habitId" value={habit.id} />
                    <input type="hidden" name="logDate" value={today} />
                    <input type="hidden" name="value" value={habit.value >= 1 ? 0 : 1} />
                    <button
                      type="submit"
                      aria-pressed={habit.value >= 1}
                      className={`rounded-control ease-spring px-4 py-2 text-sm font-medium transition-transform duration-200 active:scale-[0.97] ${
                        habit.value >= 1
                          ? "bg-accent text-on-accent"
                          : "bg-surface-raised text-text hover:bg-line"
                      }`}
                    >
                      {habit.value >= 1 ? t("habits.done") : t("habits.open")}
                    </button>
                  </form>
                ) : (
                  <form action={setHabitCheckAction} className="flex items-center gap-2">
                    <input type="hidden" name="habitId" value={habit.id} />
                    <input type="hidden" name="logDate" value={today} />
                    <input
                      type="number"
                      name="value"
                      min={0}
                      max={1440}
                      defaultValue={habit.value}
                      aria-label={habit.name}
                      className="rounded-control border-line bg-surface-raised focus-visible:ring-accent w-24 border px-3 py-2 text-base outline-none focus-visible:ring-2"
                    />
                    <span className="text-muted text-xs tabular-nums">
                      {t("habits.progress", { value: habit.value, target: habit.target })}
                    </span>
                    <button
                      type="submit"
                      className="rounded-control bg-surface-raised hover:bg-line px-3 py-2 text-sm font-medium"
                    >
                      {t("common.save")}
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </PageShell>
  );
}
