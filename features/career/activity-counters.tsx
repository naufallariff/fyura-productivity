// features/career/activity-counters.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ACTIVITY_KINDS, type ActivityKind } from "@/domain/career/activity";
import { t } from "@/lib/i18n";
import { localIsoDate } from "@/domain/time/local-date";
import { useActivityRange, useLogActivity } from "./use-career";
import { Minus, Plus } from "lucide-react";

export function ActivityCounters({ userId }: { readonly userId: string }) {
  const today = localIsoDate(new Date(), "Asia/Jakarta");
  const range = useActivityRange(userId, today, today);
  const log = useLogActivity(userId, today, today);

  const countFor = (kind: ActivityKind): number =>
    range.data?.items.find((row) => row.kind === kind)?.count ?? 0;

  return (
    <section aria-labelledby="activity-title" className="space-y-3">
      <h3 id="activity-title" className="text-sm font-semibold">
        {t("career.activity.title")}
      </h3>
      <p className="text-ink-muted text-xs leading-relaxed">{t("career.activity.lead")}</p>

      <ul className="grid gap-2 sm:grid-cols-2">
        {ACTIVITY_KINDS.map((kind) => {
          const count = countFor(kind);
          return (
            <li
              key={kind}
              className="rounded-control border-line flex items-center justify-between gap-2 border px-3 py-2"
            >
              <span className="text-sm">{t(`career.activity.kind.${kind}`)}</span>
              <span className="flex items-center gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  className="size-9 p-0"
                  aria-label={t("career.activity.minus", {
                    kind: t(`career.activity.kind.${kind}`),
                  })}
                  disabled={count === 0}
                  onClick={() => log.mutate({ activityDate: today, kind, delta: -1 })}
                  icon={Minus}
                ></Button>
                <span
                  aria-live="polite"
                  className="min-w-8 text-center text-sm font-semibold tabular-nums"
                >
                  {count}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  className="size-9 p-0"
                  aria-label={t("career.activity.plus", {
                    kind: t(`career.activity.kind.${kind}`),
                  })}
                  disabled={count >= 1000}
                  onClick={() => log.mutate({ activityDate: today, kind, delta: 1 })}
                  icon={Plus}
                ></Button>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
