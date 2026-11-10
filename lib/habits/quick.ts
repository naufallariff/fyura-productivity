import type { Category } from "@/lib/scoring/types";

export interface QuickChip {
  id: string;
  labelKey: string;
  category: Category;
  minutes: number;
}

export const QUICK_CHIPS = [
  { id: "quran", labelKey: "chip.quran", category: "WORSHIP", minutes: 15 },
  { id: "reading", labelKey: "chip.reading", category: "LEARNING", minutes: 30 },
  { id: "english", labelKey: "chip.english", category: "LEARNING", minutes: 30 },
  { id: "exercise", labelKey: "chip.exercise", category: "FITNESS", minutes: 30 },
  { id: "deep-work", labelKey: "chip.deepWork", category: "WORK", minutes: 90 },
  { id: "scrolling", labelKey: "chip.scrolling", category: "LEISURE", minutes: 15 },
] as const satisfies readonly QuickChip[];
