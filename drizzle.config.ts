import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local", quiet: true });

const url = process.env.DATABASE_URL_MIGRATE ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("Set DATABASE_URL_MIGRATE or DATABASE_URL in .env.local");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
