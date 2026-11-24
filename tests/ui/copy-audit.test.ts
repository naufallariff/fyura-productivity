import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOTS = [
  "components/dashboard",
  "components/ui",
  "lib/ui",
  "lib/i18n/messages",
  "features/dashboard",
  "features/daily-tracker",
  "features/weekly-plan",
  "features/projects",
  "features/journal/tadabur",
  "features/learning",
  "features/settings",
  "app/(app)/daily-tracker",
  "app/(app)/projects",
];
const EXTENSIONS = [".ts", ".tsx", ".json"];

// Emoji, arrows, command and modifier symbols, bullets, dashes, ellipsis, and check marks.
const FORBIDDEN =
  /\p{Extended_Pictographic}|[\u2318\u21E7\u2325\u2190-\u21FF\u2022\u00B7\u2014\u2013\u2026\u2713\u2714\u2715\u2605\u2606]/u;

function walk(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return walk(path);
    return EXTENSIONS.some((ext) => path.endsWith(ext)) ? [path] : [];
  });
}

describe("copy and symbol standard", () => {
  it("contains no emoji or symbol characters in UI code or messages", () => {
    const violations: string[] = [];

    for (const root of ROOTS) {
      for (const file of walk(root)) {
        readFileSync(file, "utf8")
          .split("\n")
          .forEach((line, index) => {
            // The dashboard uses an en dash as a placeholder for an unavailable number.
            const missingMetric =
              file === join("components", "ui", "kpi-card.tsx") &&
              line.trim() === 'export const KPI_EMPTY_VALUE = "\u2013";';
            if (!missingMetric && FORBIDDEN.test(line)) {
              violations.push(`${relative(process.cwd(), file)}:${index + 1}`);
            }
          });
      }
    }

    expect(violations).toEqual([]);
  });
});
