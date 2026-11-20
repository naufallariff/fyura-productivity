// scripts/audit-i18n.ts
// Read-only. Reports message keys that no code uses, and keys that differ between locales.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const CODE_ROOTS = ["app", "components", "features", "server", "domain", "lib", "client"];
const EXTENSIONS = [".ts", ".tsx"];
const LITERAL = /["'`]([a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9_]+)+)["'`]/g;
const TEMPLATE_PREFIX = /`([a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9_]+)*\.)\$\{/g;

function walk(directory: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(directory);
  } catch {
    return [];
  }
  return entries.flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return walk(path);
    return EXTENSIONS.some((ext) => path.endsWith(ext)) ? [path] : [];
  });
}

const files = CODE_ROOTS.flatMap(walk);
const literals = new Set<string>();
const prefixes = new Set<string>();

for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(LITERAL)) literals.add(match[1] ?? "");
  for (const match of source.matchAll(TEMPLATE_PREFIX)) prefixes.add(match[1] ?? "");
}

const load = (path: string): Set<string> =>
  new Set(Object.keys(JSON.parse(readFileSync(path, "utf8")) as Record<string, string>));

const en = load("lib/i18n/messages/en.json");
const id = load("lib/i18n/messages/id.json");

const isUsed = (key: string) =>
  literals.has(key) || [...prefixes].some((prefix) => key.startsWith(prefix));

const unused = [...en].filter((key) => !isUsed(key)).sort();
const onlyInEn = [...en].filter((key) => !id.has(key)).sort();
const onlyInId = [...id].filter((key) => !en.has(key)).sort();

console.log(`Unused keys in en.json (${unused.length}):`);
for (const key of unused) console.log(`  ${key}`);
console.log(`\nKeys missing from id.json (${onlyInEn.length}):`);
for (const key of onlyInEn) console.log(`  ${key}`);
console.log(`\nKeys only in id.json (${onlyInId.length}):`);
for (const key of onlyInId) console.log(`  ${key}`);
