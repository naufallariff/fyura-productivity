import { describe, expect, it } from "vitest";
import { HABIT_RULES, deriveValue, type BlockFact, type HabitRule } from "@/lib/habits/mapping";

const quran = HABIT_RULES.find((r) => r.habitKey === "quran") as HabitRule;
const learning = HABIT_RULES.find((r) => r.habitKey === "learning_daily") as HabitRule;
const deepWork = HABIT_RULES.find((r) => r.habitKey === "deep_work") as HabitRule;

describe("deriveValue", () => {
  it("counts a quran block of at least 10 minutes by keyword", () => {
    const blocks: BlockFact[] = [{ category: "WORSHIP", activity: "Quran reading", minutes: 15 }];
    expect(deriveValue(quran, blocks)).toBe(15);
  });

  it("ignores a worship block without a matching keyword", () => {
    const blocks: BlockFact[] = [{ category: "WORSHIP", activity: "Dhikr", minutes: 30 }];
    expect(deriveValue(quran, blocks)).toBe(0);
  });

  it("ignores a quran block shorter than the threshold", () => {
    const blocks: BlockFact[] = [{ category: "WORSHIP", activity: "Quran", minutes: 9 }];
    expect(deriveValue(quran, blocks)).toBe(0);
  });

  it("is case-insensitive for keywords", () => {
    const blocks: BlockFact[] = [{ category: "WORSHIP", activity: "QURAN", minutes: 10 }];
    expect(deriveValue(quran, blocks)).toBe(10);
  });

  it("sums quantity minutes across matching blocks", () => {
    const blocks: BlockFact[] = [
      { category: "WORK", activity: "Project A", minutes: 60 },
      { category: "WORK", activity: "Project B", minutes: 90 },
      { category: "LEISURE", activity: "Games", minutes: 120 },
    ];
    expect(deriveValue(deepWork, blocks)).toBe(150);
  });

  it("makes a binary habit 1 when any qualifying block exists, 0 otherwise", () => {
    expect(deriveValue(learning, [])).toBe(0);
    expect(deriveValue(learning, [{ category: "LEARNING", activity: "Book", minutes: 19 }])).toBe(
      0,
    );
    expect(deriveValue(learning, [{ category: "LEARNING", activity: "Book", minutes: 20 }])).toBe(
      1,
    );
  });
});
