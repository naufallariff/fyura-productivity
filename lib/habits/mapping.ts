import type { Category, HabitKind } from "@/lib/scoring/types";

export interface BlockFact {
  category: Category;
  activity: string;
  minutes: number;
}

export interface HabitRule {
  habitKey: string;
  kind: HabitKind;
  category: Category;
  /** Matched case-insensitively against the block activity. Empty means any activity. */
  keywords: readonly string[];
  /** Blocks shorter than this do not count toward the habit. */
  minMinutes: number;
}

/** Built-in rules. Keys match DEFAULT_HABITS. Prayer is manual by design, so it has no rule. */
export const HABIT_RULES: readonly HabitRule[] = [
  {
    habitKey: "quran",
    kind: "QUANTITY",
    category: "WORSHIP",
    keywords: ["quran", "tadabur"],
    minMinutes: 10,
  },
  {
    habitKey: "learning_daily",
    kind: "BINARY",
    category: "LEARNING",
    keywords: [],
    minMinutes: 20,
  },
  { habitKey: "deep_work", kind: "QUANTITY", category: "WORK", keywords: [], minMinutes: 1 },
];

function matches(rule: HabitRule, block: BlockFact): boolean {
  if (block.category !== rule.category) return false;
  if (block.minutes < rule.minMinutes) return false;
  if (rule.keywords.length === 0) return true;
  const text = block.activity.toLowerCase();
  return rule.keywords.some((word) => text.includes(word));
}

/**
 * Value a rule derives from one day's blocks.
 * BINARY: 1 if any matching block qualifies, else 0.
 * QUANTITY: total matching minutes, which the scorer caps against the target.
 */
export function deriveValue(rule: HabitRule, blocks: readonly BlockFact[]): number {
  const matched = blocks.filter((block) => matches(rule, block));
  if (rule.kind === "BINARY") return matched.length > 0 ? 1 : 0;
  return matched.reduce((sum, block) => sum + block.minutes, 0);
}
