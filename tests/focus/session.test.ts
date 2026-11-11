import { describe, expect, it } from "vitest";
import {
  countsAsDeepWork,
  elapsedMinutes,
  formatCountdown,
  remainingMs,
} from "@/lib/focus/session";

describe("remainingMs", () => {
  it("never goes below zero", () => {
    expect(remainingMs(1000, 5000)).toBe(0);
    expect(remainingMs(5000, 1000)).toBe(4000);
  });
});

describe("elapsedMinutes", () => {
  it("floors partial minutes", () => {
    expect(elapsedMinutes(0, 25 * 60_000 + 59_000)).toBe(25);
  });
});

describe("countsAsDeepWork", () => {
  it("counts only completed DEEP sessions", () => {
    expect(countsAsDeepWork("DEEP", true)).toBe(true);
    expect(countsAsDeepWork("DEEP", false)).toBe(false);
    expect(countsAsDeepWork("LIGHT", true)).toBe(false);
  });
});

describe("formatCountdown", () => {
  it("rounds up the last second so the display never shows 00:00 early", () => {
    expect(formatCountdown(1500_000)).toBe("25:00");
    expect(formatCountdown(999)).toBe("00:01");
    expect(formatCountdown(0)).toBe("00:00");
  });
});
