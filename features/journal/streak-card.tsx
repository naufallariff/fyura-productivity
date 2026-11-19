// features/journal/streak-card.tsx
import { Flame } from "lucide-react";
import { t } from "@/lib/i18n";
import type { LearningStreakView } from "@/server/services/journal";

export function StreakCard({ streak }: { readonly streak: LearningStreakView }) {
  return (
    <section aria-labelledby="streak-title" className="glass space-y-4 self-start p-5">
      <header className="flex items-center gap-2">
        <Flame aria-hidden className="text-accent size-4" strokeWidth={1.75} />
        <h3 id="streak-title" className="text-sm font-semibold">
          {t("journal.streak.title")}
        </h3>
      </header>

      <p className="text-3xl font-semibold tracking-[-0.04em] tabular-nums">
        {streak.current === 0
          ? t("streak.none")
          : t(streak.current === 1 ? "streak.days.one" : "streak.days.other", {
              count: streak.current,
            })}
      </p>

      <p className="text-ink-muted text-xs">{t(`streak.level.${streak.level}`)}</p>
      <p className="text-ink-muted text-xs">
        {streak.todayComplete ? t("journal.streak.today.done") : t("journal.streak.today.pending")}
      </p>
      <p className="text-ink-muted text-xs">{t("journal.streak.best", { days: streak.best })}</p>
      {streak.lateDays > 0 && (
        <p className="text-ink-muted text-xs">
          {t("journal.streak.late", { count: streak.lateDays })}
        </p>
      )}
      <p className="text-ink-muted text-xs leading-relaxed">{t("journal.streak.hint")}</p>
    </section>
  );
}
