import "server-only";
import type { ZodType } from "zod";
import { DomainError, type DomainErrorCode } from "@/server/services/errors";
import { logEvent } from "@/server/observability/logger";

const STATUS: Record<DomainErrorCode, number> = {
  VALIDATION_FAILED: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  HABIT_ARCHIVED: 409,
};

const NO_STORE = { "Cache-Control": "no-store" };
const PRIVATE_READ = { "Cache-Control": "private, no-cache" };

export function parseQuery<T>(schema: ZodType<T>, url: string): T {
  const params = Object.fromEntries(new URL(url).searchParams);
  const parsed = schema.safeParse(params);
  if (!parsed.success) throw new DomainError("VALIDATION_FAILED", "Query is invalid");
  return parsed.data;
}

/**
 * Reads are cached by the client, so the response may be stored privately but must be
 * revalidated. Sensitive data is never stored.
 */
export function jsonRead(body: unknown): Response {
  return Response.json(body, { headers: PRIVATE_READ });
}

export function jsonSensitive(body: unknown): Response {
  return Response.json(body, { headers: NO_STORE });
}

export function errorResponse(error: unknown, requestId: string | null): Response {
  if (error instanceof DomainError) {
    return Response.json(
      { error: error.code, message: error.message },
      { status: STATUS[error.code], headers: NO_STORE },
    );
  }
  // Only the error name is logged. Messages can contain user input.
  logEvent("error", "api request failed", {
    requestId,
    name: error instanceof Error ? error.name : "unknown",
  });
  return Response.json(
    { error: "INTERNAL", message: "Something went wrong." },
    { status: 500, headers: NO_STORE },
  );
}
