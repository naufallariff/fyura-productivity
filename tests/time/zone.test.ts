import { describe, expect, it } from "vitest";
import { isValidTimeZone } from "@/domain/time/zone";

describe("isValidTimeZone", () => {
  it("accepts IANA names and rejects unknown ones", () => {
    expect(isValidTimeZone("Asia/Jakarta")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("Mars/Base")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });
});
