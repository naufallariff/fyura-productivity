import { describe, expect, it } from "vitest";
import { splitBlock } from "@/lib/time/split-block";

describe("splitBlock", () => {
  it("keeps a block inside one day as a single segment", () => {
    expect(splitBlock("2026-10-06", 540, 90)).toEqual([
      { logDate: "2026-10-06", startMinute: 540, endMinute: 630 },
    ]);
  });

  it("splits 23:00 to 01:00 into Tuesday and Wednesday", () => {
    expect(splitBlock("2026-10-06", 1380, 120)).toEqual([
      { logDate: "2026-10-06", startMinute: 1380, endMinute: 1440 },
      { logDate: "2026-10-07", startMinute: 0, endMinute: 60 },
    ]);
  });

  it("handles a block ending exactly at midnight without a second segment", () => {
    expect(splitBlock("2026-10-06", 1380, 60)).toHaveLength(1);
  });

  it("crosses the month boundary correctly", () => {
    const segments = splitBlock("2026-10-31", 1380, 120);
    expect(segments[1]?.logDate).toBe("2026-11-01");
  });

  it("rejects invalid start or duration", () => {
    expect(() => splitBlock("2026-10-06", 1440, 30)).toThrow(/startMinute/);
    expect(() => splitBlock("2026-10-06", 0, 0)).toThrow(/durationMinutes/);
    expect(() => splitBlock("2026-10-06", 0, 1441)).toThrow(/durationMinutes/);
  });
});
