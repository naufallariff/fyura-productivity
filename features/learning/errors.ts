// features/learning/errors.ts
import { t } from "@/lib/i18n";

/** The message thrown by a failed action is its stable error code. */
export function failureCode(error: unknown): string {
  return error instanceof Error ? error.message : "INTERNAL";
}

export function errorText(code: string): string {
  switch (code) {
    case "CONFLICT":
      return t("learning.error.conflict");
    case "VALIDATION_FAILED":
      return t("learning.error.invalid");
    case "NOT_FOUND":
      return t("learning.error.notFound");
    case "RATE_LIMITED":
      return t("learning.error.rateLimited");
    default:
      return t("learning.error.generic");
  }
}
