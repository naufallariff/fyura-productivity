import { timingSafeEqual } from "node:crypto";

/** Accepts only `Authorization: Bearer <CRON_SECRET>`, compared in constant time. */
export function isAuthorizedCron(header: string | null, secret: string): boolean {
  if (!header) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
