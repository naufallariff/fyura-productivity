import "server-only";
import type { ZodType } from "zod";
import { auth } from "@/server/auth/auth";
import { logEvent } from "@/server/observability/logger";
import { DomainError, type DomainErrorCode } from "@/server/services/errors";

const STATUS: Record<DomainErrorCode, number> = {
  VALIDATION_FAILED: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  HABIT_ARCHIVED: 409,
};

const NO_STORE = { "Cache-Control": "no-store" };
const PRIVATE_READ = { "Cache-Control": "private, no-cache" };

/** Parses query parameters. Failures become DomainError with code VALIDATION_FAILED. */
export function parseQuery<T>(schema: ZodType<T>, url: string): T {
  const params = Object.fromEntries(new URL(url).searchParams);
  const parsed = schema.safeParse(params);
  if (!parsed.success) throw new DomainError("VALIDATION_FAILED", "Query is invalid");
  return parsed.data;
}

/** Reads are cached by the client. The response may be kept privately but must be revalidated. */
export function jsonRead(body: unknown): Response {
  return Response.json(body, { headers: PRIVATE_READ });
}

/** Sensitive responses are never stored by any cache. */
export function jsonSensitive(body: unknown): Response {
  return Response.json(body, { headers: NO_STORE });
}

/** Maps a thrown error to a response. Only the error name is logged, never the message. */
export function errorResponse(error: unknown, requestId: string | null): Response {
  if (error instanceof DomainError) {
    return Response.json(
      { error: error.code, message: error.message },
      { status: STATUS[error.code], headers: NO_STORE },
    );
  }
  logEvent("error", "api request failed", {
    requestId,
    name: error instanceof Error ? error.name : "unknown",
  });
  return Response.json(
    { error: "INTERNAL", message: "Something went wrong." },
    { status: 500, headers: NO_STORE },
  );
}

/** Session check for route handlers. Returns null instead of redirecting, so the client gets a 401. */
export async function apiUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export function unauthorized(): Response {
  return Response.json(
    { error: "UNAUTHORIZED", message: "Sign in required." },
    { status: 401, headers: NO_STORE },
  );
}
