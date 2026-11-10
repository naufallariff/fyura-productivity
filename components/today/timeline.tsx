import { Trash2 } from "lucide-react";
import { deleteBlockAction } from "@/app/actions/today";
import { categoryLabelKey, categoryStyle } from "@/lib/habits/categories";
import { t } from "@/lib/i18n";
import type { Category } from "@/lib/scoring/types";
import { formatMinute } from "@/lib/time/clock";
import type { Interval } from "@/lib/time/intervals";

export interface TimelineBlock {
  id: string;
  startMinute: number;
  endMinute: number;
  activity: string;
  category: Category;
  split: boolean;
}

type Item =
  | ({ kind: "block"; key: string } & TimelineBlock & Interval)
  | ({ kind: "gap"; key: string } & Interval);

export function Timeline({ blocks, gaps }: { blocks: TimelineBlock[]; gaps: Interval[] }) {
  const items: Item[] = [
    ...blocks.map((block): Item => ({
      ...block,
      kind: "block",
      key: `block-${block.id}`,
      start: block.startMinute,
      end: block.endMinute,
    })),
    ...gaps.map((gap): Item => ({
      kind: "gap",
      key: `gap-${gap.start}`,
      start: gap.start,
      end: gap.end,
    })),
  ].sort((a, b) => a.start - b.start);

  return (
    <div>
      {blocks.length === 0 && (
        <p className="text-muted mb-3 text-sm">{t("today.timeline.empty")}</p>
      )}
      <ol className="space-y-1.5">
        {items.map((item) =>
          item.kind === "gap" ? (
            <li
              key={item.key}
              className="rounded-control border-line text-muted border border-dashed px-3 py-3 text-sm"
            >
              {t("today.timeline.gap", {
                start: formatMinute(item.start),
                end: formatMinute(item.end),
              })}
            </li>
          ) : (
            <li
              key={item.key}
              className="rounded-control hover:bg-surface-raised flex items-center gap-4 px-3 py-3 transition-colors"
            >
              <span
                aria-hidden
                className="h-10 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: categoryStyle(item.category).solid }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.activity}</p>
                <p className="text-muted text-xs tabular-nums">
                  {formatMinute(item.start)} to {formatMinute(item.end)} ·{" "}
                  {t(categoryLabelKey(item.category))}
                  {item.split && ` · ${t("today.timeline.split")}`}
                </p>
              </div>
              <form action={deleteBlockAction}>
                <input type="hidden" name="blockId" value={item.id} />
                <button
                  type="submit"
                  aria-label={t("today.timeline.delete")}
                  className="text-muted hover:bg-surface-raised hover:text-danger grid size-9 place-items-center rounded-full transition-colors duration-200 active:scale-90"
                >
                  <Trash2 aria-hidden className="size-4" strokeWidth={1.75} />
                </button>
              </form>
            </li>
          ),
        )}
      </ol>
    </div>
  );
}
