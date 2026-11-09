import { config } from "dotenv";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

config({ path: ".env.local", quiet: true });

const RUN_DB_TESTS = process.env.RUN_DB_TESTS === "1";
const databaseUrl = process.env.DATABASE_URL; // must use the app_runtime role

describe.skipIf(!RUN_DB_TESTS)("RLS isolation (requires database)", () => {
  const sql = postgres(databaseUrl ?? "", { prepare: false, max: 1 });
  const stamp = Date.now();
  let userA = "";
  let userB = "";

  // Runs a callback inside a transaction that carries the given user identity
  const asUser = <T>(userId: string, run: (tx: postgres.TransactionSql) => Promise<T>) =>
    sql.begin(async (tx) => {
      await tx`select set_config('app.user_id', ${userId}, true)`;
      return run(tx);
    });

  beforeAll(async () => {
    const [a] = await sql`
      select fn_upsert_user_by_email(${`rls-a-${stamp}@test.local`}, 'Test A') as id`;
    const [b] = await sql`
      select fn_upsert_user_by_email(${`rls-b-${stamp}@test.local`}, 'Test B') as id`;
    userA = a!.id;
    userB = b!.id;
  });

  afterAll(async () => {
    await asUser(userA, (tx) => tx`delete from users where id = ${userA}`);
    await asUser(userB, (tx) => tx`delete from users where id = ${userB}`);
    await sql.end();
  });

  it("user A sees only their own row", async () => {
    const rows = await asUser(userA, (tx) => tx`select id from users`);
    expect(rows.map((r) => r.id)).toEqual([userA]);
  });

  it("without a user context, no rows are visible", async () => {
    const rows = await sql.begin(async (tx) => tx`select id from users`);
    expect(rows).toHaveLength(0);
  });

  it("user A cannot update user B", async () => {
    const rows = await asUser(
      userA,
      (tx) => tx`update users set name = 'hacked' where id = ${userB} returning id`,
    );
    expect(rows).toHaveLength(0);
  });

  it("user A cannot insert settings for user B", async () => {
    await expect(
      asUser(userA, (tx) => tx`insert into user_settings (user_id) values (${userB})`),
    ).rejects.toThrow();
  });
});
