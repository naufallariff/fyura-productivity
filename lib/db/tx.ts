import "server-only";
import { sql } from "drizzle-orm";
import { db } from "./client";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Menjalankan fungsi di dalam transaksi yang sudah membawa identitas pengguna.
 * Policy RLS membaca nilai `app.user_id` ini. Parameter `true` berarti
 * nilainya hanya berlaku di dalam transaksi ini.
 */
export async function withUser<T>(userId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  if (!UUID.test(userId)) throw new Error("withUser: userId tidak valid");
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.user_id', ${userId}, true)`);
    return fn(tx);
  });
}
