import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const VALID_ENV = {
  NODE_ENV: "test",
  APP_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://localhost:5432/test",
  AUTH_SECRET: "a".repeat(32),
  AUTH_GOOGLE_ID: "id",
  AUTH_GOOGLE_SECRET: "secret",
  ALLOWED_EMAILS: "Owner@Gmail.com, other@gmail.com",
  PRIVATE_PIN_PEPPER: "b".repeat(32),
  ENCRYPTION_KEY: "c".repeat(64),
  CRON_SECRET: "d".repeat(32),
} as const;

describe("environment configuration", () => {
  const original = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...original, ...VALID_ENV };
  });

  afterEach(() => {
    process.env = original;
  });

  it("accepts a complete configuration and normalizes emails", async () => {
    const { env } = await import("@/lib/config/env");
    expect(env.ALLOWED_EMAILS).toEqual(["owner@gmail.com", "other@gmail.com"]);
    expect(env.DEFAULT_TIMEZONE).toBe("Asia/Jakarta");
  });

  it("fails when AUTH_SECRET is too short", async () => {
    process.env.AUTH_SECRET = "too-short";
    await expect(import("@/lib/config/env")).rejects.toThrow(/AUTH_SECRET/);
  });

  it("fails when ENCRYPTION_KEY is not 64 hexadecimal characters", async () => {
    process.env.ENCRYPTION_KEY = "xyz";
    await expect(import("@/lib/config/env")).rejects.toThrow(/ENCRYPTION_KEY/);
  });

  it("fails when ALLOWED_EMAILS contains no valid email", async () => {
    process.env.ALLOWED_EMAILS = " , ";
    await expect(import("@/lib/config/env")).rejects.toThrow(/ALLOWED_EMAILS/);
  });

  it("treats an empty SENTRY_DSN as not configured", async () => {
    process.env.SENTRY_DSN = "";
    const { env } = await import("@/lib/config/env");
    expect(env.SENTRY_DSN).toBeUndefined();
  });
});
