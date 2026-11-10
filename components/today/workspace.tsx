"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { AddBlockSheet, type Draft } from "./add-block-sheet";
import { DayGrid, type GridBlock } from "./day-grid";
import { BLOCK_CATEGORIES, categoryLabelKey, categoryStyle } from "@/lib/habits/categories";
import { t } from "@/lib/i18n";

export function TodayWorkspace({ logDate, blocks }: { logDate: string; blocks: GridBlock[] }) {
  const [draft, setDraft] = useState<Draft | null>(null);

  // Stable identities: the sheet's success effect depends on them.
  const close = useCallback(() => setDraft(null), []);
  const openAt = useCallback(
    (start: number, end: number) => setDraft({ start, end, nonce: Date.now() }),
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ul className="text-muted flex flex-wrap gap-3 text-xs">
          {BLOCK_CATEGORIES.map((category) => (
            <li key={category} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{ background: categoryStyle(category).solid }}
              />
              {t(categoryLabelKey(category))}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => openAt(540, 600)}
          className="rounded-control bg-accent text-on-accent ease-spring inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-transform duration-200 active:scale-[0.97]"
        >
          <Plus aria-hidden className="size-4" strokeWidth={2} />
          {t("today.add")}
        </button>
      </div>

      <DayGrid blocks={blocks} onCreate={openAt} />
      <AddBlockSheet logDate={logDate} draft={draft} onClose={close} />
    </div>
  );
}
