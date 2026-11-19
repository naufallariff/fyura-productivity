// server/services/user.ts
import "server-only";
import { z } from "zod";
import { env } from "@/server/config/env";
import { withUser } from "@/server/db/tx";
import { findTimeZone, updateTimeZone } from "@/server/db/repositories/profile";
import { isValidTimeZone } from "@/domain/time/zone";
import { DomainError } from "./errors";
import { parse } from "./parse";

const TimeZoneInput = z
  .object({
    timeZone: z.string().min(1).max(64).refine(isValidTimeZone, "Unknown time zone"),
  })
  .strict();

/** The user's stored zone. Falls back to the default if the stored value is no longer valid. */
export async function getUserTimeZone(userId: string): Promise<string> {
  const stored = await withUser(userId, (tx) => findTimeZone(tx, userId));
  return stored !== null && isValidTimeZone(stored) ? stored : env.DEFAULT_TIMEZONE;
}

export async function setUserTimeZone(userId: string, input: unknown): Promise<void> {
  const parsed = parse(TimeZoneInput, input);
  await withUser(userId, async (tx) => {
    const updated = await updateTimeZone(tx, userId, parsed.timeZone);
    if (!updated) throw new DomainError("NOT_FOUND", "User not found");
  });
}
