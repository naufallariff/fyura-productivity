import { describe, expect, it } from "vitest";
import { isAuthorizedCron } from "@/lib/cron/auth";

const SECRET = "c".repeat(32);

describe("cron authorization", () => {
  it("accepts the correct bearer secret", () => {
    expect(isAuthorizedCron(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it("rejects a missing header", () => {
    expect(isAuthorizedCron(null, SECRET)).toBe(false);
  });

  it("rejects a wrong secret", () => {
    expect(isAuthorizedCron(`Bearer ${"x".repeat(32)}`, SECRET)).toBe(false);
  });

  it("rejects the secret without the Bearer prefix", () => {
    expect(isAuthorizedCron(SECRET, SECRET)).toBe(false);
  });
});
