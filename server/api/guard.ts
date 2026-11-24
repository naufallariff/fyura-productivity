// server/api/guard.ts
import "server-only";
import { z, type ZodType } from "zod";
import { auth } from "@/server/auth/auth";
import { logEvent } from "@/server/observability/logger";
import { DomainError, type DomainErrorCode } from "@/server/services/errors";

const STATUS: Record<Exclude<DomainErrorCode, "INTERNAL">, number> = {
  VALIDATION_FAILED: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  HABIT_ARCHIVED: 409,
  RATE_LIMITED: 429,
  PRIVATE_LOCKED: 403,
};

const NO_STORE = { "Cache-Control": "no-store" };
const PRIVATE_READ = { "Cache-Control": "private, no-cache" };

export function parseQuery<T>(schema: ZodType<T>, url: string): T {
  const params = Object.fromEntries(new URL(url).searchParams);
  const parsed = schema.safeParse(params);
  if (!parsed.success) throw new DomainError("VALIDATION_FAILED", "Query is invalid");
  return parsed.data;
}

/** Validates an id taken from the URL path. */
export function parseParam(value: string): string {
  const parsed = z.uuid().safeParse(value);
  if (!parsed.success) throw new DomainError("VALIDATION_FAILED", "Id is invalid");
  return parsed.data;
}

export function jsonRead(body: unknown): Response {
  return Response.json(body, { headers: PRIVATE_READ });
}

export function jsonSensitive(body: unknown): Response {
  return Response.json(body, { headers: NO_STORE });
}

export function errorResponse(error: unknown, requestId: string | null): Response {
  if (error instanceof DomainError && error.code !== "INTERNAL") {
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
