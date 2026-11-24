// features/journal/streak-card.tsx
import { t } from "@/lib/i18n";
import type { LearningStreakView } from "@/server/services/journal";
import { Fire } from "@/features/learning/fire";

export function StreakCard({ streak }: { readonly streak: LearningStreakView }) {
  return (
    <section
      aria-labelledby="streak-title"
      className="space-y-4 self-start rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-4 shadow-(--shadow-card)"
    >
      <h3 id="streak-title" className="text-sm font-semibold">
        {t("journal.streak.title")}
      </h3>
      <Fire level={streak.level} streak={streak.current} />
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
