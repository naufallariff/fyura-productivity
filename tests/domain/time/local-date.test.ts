import { describe, expect, it } from "vitest";
import { isValidIsoDate, localIsoDate } from "@/lib/time/local-date";

describe("localIsoDate", () => {
  it("uses the target timezone for the calendar date", () => {
    const instant = new Date("2026-10-06T17:30:00Z"); // 00:30 on 7 October in Jakarta
    expect(localIsoDate(instant, "Asia/Jakarta")).toBe("2026-10-07");
    expect(localIsoDate(instant, "UTC")).toBe("2026-10-06");
  });
});

describe("isValidIsoDate", () => {
  it("accepts real dates and rejects impossible ones", () => {
    expect(isValidIsoDate("2026-10-06")).toBe(true);
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("06-10-2026")).toBe(false);
  });
});
