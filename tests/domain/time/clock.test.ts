import { describe, expect, it } from "vitest";
import { formatMinute, parseClock } from "@/lib/time/clock";

describe("parseClock", () => {
  it("converts HH:MM to minutes from midnight", () => {
    expect(parseClock("09:05")).toBe(545);
    expect(parseClock("23:59")).toBe(1439);
  });

  it("rejects 24:00, single-digit hours, and non-clock text", () => {
    expect(parseClock("24:00")).toBeNull();
    expect(parseClock("9:05")).toBeNull();
    expect(parseClock("noon")).toBeNull();
  });
});

describe("formatMinute", () => {
  it("formats minutes as HH:MM, with 1440 as 24:00", () => {
    expect(formatMinute(545)).toBe("09:05");
    expect(formatMinute(1440)).toBe("24:00");
  });

  it("rejects values outside the day", () => {
    expect(() => formatMinute(-1)).toThrow(RangeError);
    expect(() => formatMinute(1441)).toThrow(RangeError);
  });
});
