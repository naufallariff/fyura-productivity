import { timingSafeEqual } from "node:crypto";
import { env } from "@/server/config/env";

if (!env.CRON_SECRET?.trim()) {
  throw new Error("CRON_SECRET must be non-empty to enable cron authentication.");
}

const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);

/** Accepts only `Authorization: Bearer <CRON_SECRET>`, compared in constant time. */
export function isAuthorizedCron(header: string | null): boolean {
  if (!header) return false;

  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
