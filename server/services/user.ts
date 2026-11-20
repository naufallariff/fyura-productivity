// server/services/user.ts
import "server-only";
import { z } from "zod";
import { env } from "@/server/config/env";
import { withUser, type Tx } from "@/server/db/tx";
import { findTimeZone, updateTimeZone } from "@/server/db/repositories/profile";
import { localIsoDate } from "@/domain/time/local-date";
import { isValidTimeZone } from "@/domain/time/zone";
import { DomainError } from "@/server/services/errors";
import { parse } from "@/server/services/parse";

const TimeZoneInput = z
  .object({
    timeZone: z.string().min(1).max(64).refine(isValidTimeZone, "Unknown time zone"),
  })
  .strict();

/** The user's zone inside a transaction that already belongs to them. Falls back to the default for missing or invalid values. */
export async function readTimeZone(tx: Tx, userId: string): Promise<string> {
  const stored = await findTimeZone(tx, userId);
  return stored !== null && isValidTimeZone(stored) ? stored : env.DEFAULT_TIMEZONE;
}

/** Zone and today's logical date, read inside the caller's transaction. */
export async function todayFor(
  tx: Tx,
  userId: string,
): Promise<{ timeZone: string; today: string }> {
  const timeZone = await readTimeZone(tx, userId);
  return { timeZone, today: localIsoDate(new Date(), timeZone) };
}

/** Zone and today for the signed-in user. Pages call this instead of computing dates during render. */
export async function getUserDay(userId: string): Promise<{ timeZone: string; today: string }> {
  return withUser(userId, (tx) => todayFor(tx, userId));
}

export async function getUserTimeZone(userId: string): Promise<string> {
  return withUser(userId, (tx) => readTimeZone(tx, userId));
}

export async function setUserTimeZone(userId: string, input: unknown): Promise<void> {
  const parsed = parse(TimeZoneInput, input);
  await withUser(userId, async (tx) => {
    const updated = await updateTimeZone(tx, userId, parsed.timeZone);
    if (!updated) throw new DomainError("NOT_FOUND", "User not found");
  });
}
