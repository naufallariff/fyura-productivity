import { t, tPlural } from "@/lib/i18n";
import type { FireLevel } from "@/lib/scoring/streak";

const SCALE: Record<FireLevel, number> = {
  ember: 0.6,
  kindle: 0.8,
  blaze: 1,
  inferno: 1.15,
  core: 1.3,
};

export function Fire({ level, streak }: { level: FireLevel; streak: number }) {
  return (
    <div className="flex items-center gap-4">
      <div style={{ transform: `scale(${SCALE[level]})`, transformOrigin: "50% 100%" }}>
        <svg viewBox="0 0 48 56" className="fire-flicker size-12" aria-hidden>
          <path
            d="M24 2C30 14 42 22 42 36a18 18 0 0 1-36 0c0-8 4-13 8-18 1 6 3 9 6 10C18 19 19 10 24 2Z"
            style={{ fill: "var(--accent)" }}
            opacity="0.35"
          />
          <path
            d="M24 16c4 7 12 12 12 22a12 12 0 0 1-24 0c0-6 3-9 6-12 0 4 2 6 4 7-1-5 0-10 2-17Z"
            style={{ fill: "var(--accent)" }}
            opacity="0.7"
          />
          <path
            d="M24 34c2 3 5 5 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9Z"
            style={{ fill: "var(--on-accent)" }}
          />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold">{t(`streak.level.${level}`)}</p>
        <p className="text-muted text-sm">
          {streak === 0 ? t("streak.none") : tPlural("streak.days", streak)}
        </p>
      </div>
    </div>
  );
}
