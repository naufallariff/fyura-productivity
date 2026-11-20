// features/journal/tadabur/errors.ts
import { t } from "@/lib/i18n";

/** The message thrown by a failed action is its stable error code. */
export function failureCode(error: unknown): string {
  return error instanceof Error ? error.message : "INTERNAL";
}

export function tadaburErrorText(code: string): string {
  if (code === "VALIDATION_FAILED") return t("tadabur.error.invalid");
  if (code === "NOT_FOUND") return t("tadabur.error.notFound");
  if (code === "RATE_LIMITED") return t("tadabur.error.rateLimited");
  return t("tadabur.error.generic");
}
