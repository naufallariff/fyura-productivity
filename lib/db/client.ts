import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/config/env";
import * as schema from "./schema";

// One connection pool per process. In development it is cached on globalThis
// so that hot reloads do not open a new pool on every change.
const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

const sql =
  globalForDb.sql ??
  postgres(env.DATABASE_URL, {
    max: 5,
    // Required for the Supabase transaction pooler (port 6543).
    // Prepared statements are not supported across pooled transactions.
    prepare: false,
  });

if (env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
