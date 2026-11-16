// features/daily-tracker/category-hue.ts
import type { Category } from "@/domain/scoring/types";
import type { Hue } from "@/lib/theme/hues";

/** One hue per category. Colors come from theme tokens, so they follow the active mode. */
export const CATEGORY_HUE: Readonly<Record<Category, Hue>> = {
  WORSHIP: "teal",
  LEARNING: "indigo",
  WORK: "orange",
  CAREER: "rose",
  FITNESS: "emerald",
  REST: "sky",
  SOCIAL: "amber",
  LEISURE: "violet",
};
