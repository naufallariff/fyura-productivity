import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { privateRecords } from "@/server/db/schema";
import type { Tx } from "@/server/db/tx";

export type PrivateRecordRow = typeof privateRecords.$inferSelect;
type RecordCiphertext = Pick<PrivateRecordRow, "titleCiphertext" | "bodyCiphertext">;

export function listPrivateRecordRows(tx: Tx, userId: string) {
  return tx
    .select()
    .from(privateRecords)
    .where(and(eq(privateRecords.userId, userId), isNull(privateRecords.deletedAt)))
    .orderBy(desc(privateRecords.updatedAt), desc(privateRecords.id));
}

export async function insertPrivateRecord(tx: Tx, userId: string, ciphertext: RecordCiphertext) {
  const [row] = await tx
    .insert(privateRecords)
    .values({ userId, ...ciphertext })
    .returning();
  return row;
}

function activeRecord(userId: string, id: string) {
  return and(
    eq(privateRecords.userId, userId),
    eq(privateRecords.id, id),
    isNull(privateRecords.deletedAt),
  );
}

export async function updatePrivateRecordRow(
  tx: Tx,
  userId: string,
  id: string,
  ciphertext: RecordCiphertext,
) {
  const [row] = await tx
    .update(privateRecords)
    .set({ ...ciphertext, updatedAt: new Date() })
    .where(activeRecord(userId, id))
    .returning();
  return row;
}

export async function softDeletePrivateRecord(
  tx: Tx,
  userId: string,
  id: string,
): Promise<boolean> {
  const now = new Date();
  const rows = await tx
    .update(privateRecords)
    .set({ deletedAt: now, updatedAt: now })
    .where(activeRecord(userId, id))
    .returning({ id: privateRecords.id });
  return rows.length > 0;
}
