import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });

export const RUN_DB_TESTS = process.env.RUN_DB_TESTS === "1";

/** Connection as the app_runtime role, so RLS applies exactly as in production. */
export function createTestSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required for database tests");
  return postgres(url, { prepare: false, max: 1 });
}

export async function createTestUser(sql: postgres.Sql, label: string): Promise<string> {
  const email = `svc-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
  const [row] = await sql<{ id: string }[]>`
    select fn_upsert_user_by_email(${email}, ${label}) as id`;
  if (!row) throw new Error("fn_upsert_user_by_email returned no id");
  return row.id;
}

export async function deleteTestUser(sql: postgres.Sql, userId: string): Promise<void> {
  // Runs outside RLS scope only through the owner role. Here we use the same session
  // with app.user_id set, so the policy allows deleting the user's own row.
  await sql.begin(async (tx) => {
    await tx`select set_config('app.user_id', ${userId}, true)`;
    await tx`delete from users where id = ${userId}`;
  });
}
