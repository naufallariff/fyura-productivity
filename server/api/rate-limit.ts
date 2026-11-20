// server/api/rate-limit.ts
import "server-only";
import { withUser } from "@/server/db/tx";
import { consumeRateToken } from "@/server/db/repositories/projects";
import { DomainError } from "@/server/services/errors";

/**
 * Fixed-window limits per user. Storage lives in Postgres, so the limit holds across
 * serverless instances. The window start is aligned to the clock, so every user gets
 * the same windows.
 */
export const RATE_LIMITS = {
  write: { limit: 60, windowMs: 60_000 },
  read: { limit: 300, windowMs: 60_000 },
} as const;

export type RateBucket = keyof typeof RATE_LIMITS;

export async function consumeRateLimit(userId: string, bucket: RateBucket): Promise<void> {
  const { limit, windowMs } = RATE_LIMITS[bucket];
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  const allowed = await withUser(userId, (tx) =>
    consumeRateToken(tx, userId, bucket, windowStart, limit),
  );
  if (!allowed) {
    throw new DomainError("RATE_LIMITED", "Too many requests. Wait a moment and try again.");
  }
}
