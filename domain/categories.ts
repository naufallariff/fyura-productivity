import type { Category } from "@/lib/scoring/types";

export const BLOCK_CATEGORIES = [
  "WORSHIP",
  "LEARNING",
  "WORK",
  "CAREER",
  "FITNESS",
  "REST",
  "SOCIAL",
  "LEISURE",
] as const satisfies readonly Category[];

/** Fixed category colors. Independent of the active palette so categories stay recognizable. */
export const CATEGORY_STYLE: Record<Category, { solid: string }> = {
  WORSHIP: { solid: "#14B8A6" },
  LEARNING: { solid: "#6366F1" },
  WORK: { solid: "#F97316" },
  CAREER: { solid: "#EC4899" },
  FITNESS: { solid: "#22C55E" },
  REST: { solid: "#64748B" },
  SOCIAL: { solid: "#EAB308" },
  LEISURE: { solid: "#A855F7" },
};

const KNOWN = new Set<string>(BLOCK_CATEGORIES);

export function categoryStyle(category: Category): { solid: string } {
  return CATEGORY_STYLE[category];
}

export function categoryLabelKey(category: Category): string {
  return `category.${category}`;
}

/** Narrows a stored string to a Category. Unknown values fail loudly instead of rendering wrong. */
export function toCategory(value: string): Category {
  if (!KNOWN.has(value)) {
    throw new Error(`Unknown category: ${value}`);
  }
  return value as Category;
}
