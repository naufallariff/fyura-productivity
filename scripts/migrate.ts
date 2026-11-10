import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL_MIGRATE;
  if (!url) {
    console.error("DATABASE_URL_MIGRATE is not set in .env.local");
    process.exitCode = 1;
    return;
  }

  // onnotice silences the harmless "already exists, skipping" notices.
  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  const db = drizzle(sql);

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations applied successfully.");
  } catch (error) {
    // Drizzle wraps the real PostgreSQL error in `cause`. Print that.
    const cause = error instanceof Error && error.cause ? error.cause : error;
    console.error("Migration failed. Database error:");
    console.error(cause);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

void main();
