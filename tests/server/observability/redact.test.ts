import { describe, expect, it } from "vitest";
import { redact } from "@/lib/observability/redact";

describe("redact", () => {
  it("replaces secrets, cookies, PINs, emails, and OAuth codes", () => {
    const out = redact({
      requestId: "abc",
      authToken: "x",
      cookie: "y",
      pinHash: "z",
      email: "owner@example.com",
      code: "4/0AUn6H",
      statusCode: 500,
    }) as Record<string, unknown>;

    expect(out.requestId).toBe("abc");
    expect(out.statusCode).toBe(500);
    expect(out.authToken).toBe("[REDACTED]");
    expect(out.cookie).toBe("[REDACTED]");
    expect(out.pinHash).toBe("[REDACTED]");
    expect(out.email).toBe("[REDACTED]");
    expect(out.code).toBe("[REDACTED]");
  });

  it("redacts nested objects and arrays", () => {
    const out = redact({ items: [{ secretValue: "a" }] }) as { items: { secretValue: string }[] };
    expect(out.items[0]?.secretValue).toBe("[REDACTED]");
  });

  it("does not mutate the input", () => {
    const input = { password: "p" };
    redact(input);
    expect(input.password).toBe("p");
  });
});
