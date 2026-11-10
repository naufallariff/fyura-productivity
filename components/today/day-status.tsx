import { setDayStatusAction } from "@/app/actions/today";
import { t } from "@/lib/i18n";
import type { DayStatus } from "@/lib/scoring/types";

const STATUSES: readonly DayStatus[] = ["NORMAL", "SICK", "FLEXIBLE", "OFF"];

export function DayStatusCard({ logDate, current }: { logDate: string; current: DayStatus }) {
  return (
    <section
      aria-labelledby="day-status-title"
      className="elevated rounded-card border-line bg-surface border p-6"
    >
      <h2 id="day-status-title" className="text-sm font-semibold">
        {t("today.status.title")}
      </h2>
      <form action={setDayStatusAction} className="mt-4 grid grid-cols-2 gap-2">
        <input type="hidden" name="logDate" value={logDate} />
        {STATUSES.map((status) => {
          const active = status === current;
          return (
            <button
              key={status}
              type="submit"
              name="status"
              value={status}
              aria-pressed={active}
              className={`rounded-control ease-spring px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                active ? "bg-accent text-on-accent" : "bg-surface-raised text-text hover:bg-line"
              }`}
            >
              {t(`today.status.${status}`)}
            </button>
          );
        })}
      </form>
      <p className="text-muted mt-4 text-xs leading-relaxed">{t("today.status.hint")}</p>
    </section>
  );
}
