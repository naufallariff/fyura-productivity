import "server-only";
import { sql } from "drizzle-orm";
import { db } from "./client";
import { normalizeEmail } from "@/lib/auth/allowlist";

/**
 * Creates or updates the user row for a verified Google account and returns its id.
 * Runs through a SECURITY DEFINER function because no user context exists yet.
 */
export async function upsertUserByEmail(email: string, name: string | null): Promise<string> {
  const normalized = normalizeEmail(email);
  const rows = await db.execute<{ id: string }>(
    sql`select public.fn_upsert_user_by_email(${normalized}, ${name}) as id`,
  );
  const id = rows[0]?.id;
  if (!id) {
    throw new Error("upsertUserByEmail: the database returned no user id");
  }
  return id;
}
