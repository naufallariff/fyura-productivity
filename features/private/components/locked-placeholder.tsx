import { Lock } from "lucide-react";
import { t } from "@/lib/i18n";

export function LockedPlaceholder() {
  return (
    <section className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-8 text-center shadow-(--shadow-card)">
      <div className="bg-ink/5 text-accent mx-auto grid size-12 place-items-center rounded-2xl">
        <Lock aria-hidden className="size-5" strokeWidth={1.75} />
      </div>
      <h2 className="mt-4 text-lg font-semibold tracking-[-0.01em]">
        {t("privateSpace.locked.title")}
      </h2>
      <p className="text-ink-muted mt-1 text-sm">{t("privateSpace.locked.body")}</p>
    </section>
  );
}
