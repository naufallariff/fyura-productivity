// server/db/repositories/profile.ts
import "server-only";
import { eq } from "drizzle-orm";
import type { Tx } from "@/server/db/tx";
import { users } from "@/server/db/schema";

export async function findTimeZone(tx: Tx, userId: string): Promise<string | null> {
  const [row] = await tx
    .select({ timezone: users.timezone })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.timezone ?? null;
}

export async function updateTimeZone(tx: Tx, userId: string, timeZone: string): Promise<boolean> {
  const rows = await tx
    .update(users)
    .set({ timezone: timeZone, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id });
  return rows.length === 1;
}
