import { describe, expect, it } from "vitest";
import { bestStreak, currentStreak, fireLevel, isLateEntry } from "@/lib/scoring/streak";
import { addDays, daysBetween, isoWeekday } from "@/lib/time/logical-date";

const DAYS = [
  { date: "2026-10-01", complete: true },
  { date: "2026-10-02", complete: true },
  { date: "2026-10-03", complete: false },
  { date: "2026-10-04", complete: true },
  { date: "2026-10-05", complete: true },
];

describe("currentStreak", () => {
  it("counts back from today when today is complete", () => {
    expect(currentStreak(DAYS, "2026-10-05")).toBe(2);
  });

  it("counts back from yesterday when today is not complete yet", () => {
    const days = [...DAYS.slice(0, 4), { date: "2026-10-05", complete: false }];
    expect(currentStreak(days, "2026-10-05")).toBe(1);
  });

  it("returns 0 when neither today nor yesterday is complete", () => {
    const days = [{ date: "2026-10-03", complete: true }];
    expect(currentStreak(days, "2026-10-05")).toBe(0);
  });
});

describe("bestStreak", () => {
  it("keeps the record even after a break", () => {
    expect(bestStreak(DAYS)).toBe(2);
  });
});

describe("fireLevel", () => {
  it.each([
    [0, "ember"],
    [1, "kindle"],
    [6, "kindle"],
    [7, "blaze"],
    [29, "blaze"],
    [30, "inferno"],
    [89, "inferno"],
    [90, "core"],
  ] as const)("maps streak %i to %s", (streak, level) => {
    expect(fireLevel(streak)).toBe(level);
  });

  it("rejects negative or fractional streaks", () => {
    expect(() => fireLevel(-1)).toThrow();
    expect(() => fireLevel(1.5)).toThrow();
  });
});

describe("isLateEntry", () => {
  it("flags an entry written two or more days after its log date", () => {
    expect(isLateEntry("2026-10-05", "2026-10-06")).toBe(false);
    expect(isLateEntry("2026-10-05", "2026-10-07")).toBe(true);
  });
});

describe("logical date helpers", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(daysBetween("2026-02-27", "2026-03-01")).toBe(2);
  });

  it("uses ISO weekday numbering with Monday as 1", () => {
    expect(isoWeekday("2026-11-09")).toBe(1);
    expect(isoWeekday("2026-11-15")).toBe(7);
  });

  it("rejects impossible calendar dates", () => {
    expect(() => addDays("2026-02-30", 1)).toThrow(/Invalid/);
  });
});
