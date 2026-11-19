// domain/capture/tags.ts
// Pure tag rules shared by validation, services, and the UI. No framework imports.

const TAG_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/;

export const MAX_TAGS_PER_IDEA = 10;

/** Lowercases, strips one leading hash, and returns null when the result is not a valid tag. */
export function normalizeTag(raw: string): string | null {
  const value = raw.trim().replace(/^#/, "").toLowerCase();
  return TAG_PATTERN.test(value) ? value : null;
}

/** Unique valid tags in first-seen order, capped at MAX_TAGS_PER_IDEA. Invalid entries are dropped. */
export function normalizeTags(raw: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const item of raw) {
    const tag = normalizeTag(item);
    if (tag !== null) seen.add(tag);
  }
  return [...seen].slice(0, MAX_TAGS_PER_IDEA);
}

/** Tags written inline in text, such as "#ai" inside a note. */
export function extractTags(text: string): string[] {
  return normalizeTags(text.match(/#[A-Za-z0-9][A-Za-z0-9-]{0,31}/g) ?? []);
}
