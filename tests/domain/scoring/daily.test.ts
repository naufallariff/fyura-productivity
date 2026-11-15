import { describe, expect, it } from "vitest";
import { prayerDailyValue } from "@/lib/scoring/daily";

describe("prayerDailyValue", () => {
  it("returns 1 only when all five prayers are performed", () => {
    expect(prayerDailyValue([true, true, true, true, true])).toBe(1);
  });

  it("returns 0 when any single prayer is missed", () => {
    expect(prayerDailyValue([true, true, true, true, false])).toBe(0);
    expect(prayerDailyValue([false, false, false, false, false])).toBe(0);
  });

  it("rejects a flag list that is not exactly five long", () => {
    expect(() => prayerDailyValue([true, true])).toThrow(/Expected 5/);
  });
});
