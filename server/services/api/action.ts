import "server-only";
import { logEvent } from "@/server/observability/logger";
import { DomainError, type DomainErrorCode } from "@/server/services/errors";

export type ActionResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly code: DomainErrorCode | "INTERNAL" };

/** Wraps a server action. Expected failures return a code. Unexpected ones are logged and reported generically. */
export async function runAction<T>(task: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await task() };
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, code: error.code };
    logEvent("error", "action failed", {
      name: error instanceof Error ? error.name : "unknown",
    });
    return { ok: false, code: "INTERNAL" };
  }
}
