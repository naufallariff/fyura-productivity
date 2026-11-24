// features/projects/format.ts
import { t } from "@/lib/i18n";

export const CONTROL_CLASS =
  "min-h-11 w-full rounded-lg border border-(--border-control) bg-(--bg-surface) px-4 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm";

export const TEXTAREA_CLASS =
  "min-h-24 w-full rounded-lg border border-(--border-control) bg-(--bg-surface) px-4 py-2 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm";

/** Due dates are calendar dates, so they are formatted in UTC to avoid a day shift. */
export function formatDueDate(iso: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export function formatUpdated(iso: string): string {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
}

/** The message thrown by a failed server action is its stable error code. */
export function failureCode(error: unknown): string {
  return error instanceof Error ? error.message : "INTERNAL";
}

export function errorText(code: string): string {
  switch (code) {
    case "NOT_FOUND":
      return t("projects.error.notFound");
    case "CONFLICT":
      return t("projects.error.conflict");
    case "RATE_LIMITED":
      return t("projects.error.rateLimited");
    case "VALIDATION_FAILED":
      return t("projects.error.validation");
    default:
      return t("projects.error.generic");
  }
}
