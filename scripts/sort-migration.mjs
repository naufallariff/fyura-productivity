// scripts/sort-migration.mjs
// Reorders the newest generated migration: CREATE TABLE first, then CREATE INDEX,
// then everything else. Custom migrations (written by hand, no statement separators)
// are left untouched.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "drizzle";
const SEPARATOR = "--> statement-breakpoint";

const latest = readdirSync(DIR)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .at(-1);

if (!latest) {
  console.error("No migration file found in drizzle/");
  process.exit(1);
}

const file = join(DIR, latest);
const content = readFileSync(file, "utf8");

if (!content.includes(SEPARATOR)) {
  console.log(`Skipped ${file}: custom migration, order is kept as written.`);
  process.exit(0);
}

const parts = content
  .split(SEPARATOR)
  .map((part) => part.trim())
  .filter(Boolean);

const rank = (statement) => {
  if (/^CREATE TABLE/.test(statement)) return 0;
  if (/^CREATE (UNIQUE )?INDEX/.test(statement)) return 1;
  return 2;
};

const ordered = parts
  .map((statement, index) => ({ statement, index, rank: rank(statement) }))
  .sort((a, b) => a.rank - b.rank || a.index - b.index)
  .map((item) => item.statement);

writeFileSync(file, ordered.join(`\n${SEPARATOR}\n`) + "\n");
console.log(`Sorted ${ordered.length} statements in ${file}`);
