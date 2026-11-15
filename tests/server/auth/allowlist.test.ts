import { describe, expect, it } from "vitest";
import { isAllowedEmail, normalizeEmail } from "@/lib/auth/allowlist";

const ALLOWED = ["owner@gmail.com"];

describe("allowlist", () => {
  it("normalizes case and surrounding whitespace", () => {
    expect(normalizeEmail("  Owner@Gmail.COM ")).toBe("owner@gmail.com");
  });

  it("accepts an allowed email regardless of case", () => {
    expect(isAllowedEmail("OWNER@gmail.com", ALLOWED)).toBe(true);
  });

  it("rejects an email that is not on the list", () => {
    expect(isAllowedEmail("stranger@gmail.com", ALLOWED)).toBe(false);
  });

  it("rejects an empty email", () => {
    expect(isAllowedEmail("   ", ALLOWED)).toBe(false);
  });

  it("does not match a partial or suffixed address", () => {
    expect(isAllowedEmail("owner@gmail.com.evil.io", ALLOWED)).toBe(false);
  });
});
