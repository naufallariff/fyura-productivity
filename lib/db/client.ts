import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/config/env";
import * as schema from "./schema";

// Satu koneksi per proses. Di development, disimpan di globalThis
// agar hot reload tidak membuka koneksi baru terus-menerus.
const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

const sql =
  globalForDb.sql ??
  postgres(env.DATABASE_URL, {
    max: 5,
    // Wajib untuk connection pooler Supabase mode transaction
    prepare: false,
  });

if (env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
