import { NAV_SECTIONS, type NavSectionId } from "@/lib/nav/sections";

export const NAV_GROUPS_COOKIE = "fyura_nav_groups";

/** Only known group IDs survive an old or malformed preference cookie. */
export function parseFoldedGroups(value: string | undefined): NavSectionId[] {
  const ids = new Set(value?.split(".") ?? []);
  return NAV_SECTIONS.filter((section) => ids.has(section.id)).map((section) => section.id);
}

export function serializeFoldedGroups(ids: readonly NavSectionId[]): string {
  return NAV_SECTIONS.filter((section) => ids.includes(section.id))
    .map((section) => section.id)
    .join(".");
}
