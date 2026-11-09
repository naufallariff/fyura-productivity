import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

const VALID = {
  NODE_ENV: "test",
  APP_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://x",
  AUTH_SECRET: "a".repeat(32),
  AUTH_GOOGLE_ID: "id",
  AUTH_GOOGLE_SECRET: "secret",
  ALLOWED_EMAILS: "Owner@Gmail.com, other@gmail.com",
  PRIVATE_PIN_PEPPER: "b".repeat(32),
  ENCRYPTION_KEY: "c".repeat(64),
  CRON_SECRET: "d".repeat(32),
} as const;

describe("env", () => {
  const original = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...original, ...VALID };
  });

  afterEach(() => {
    process.env = original;
  });

  it("menerima konfigurasi lengkap dan menormalkan email", async () => {
    const { env } = await import("@/lib/config/env");
    expect(env.ALLOWED_EMAILS).toEqual(["owner@gmail.com", "other@gmail.com"]);
    expect(env.DEFAULT_TIMEZONE).toBe("Asia/Jakarta");
  });

  it("gagal saat AUTH_SECRET terlalu pendek", async () => {
    process.env.AUTH_SECRET = "pendek";
    await expect(import("@/lib/config/env")).rejects.toThrow(/AUTH_SECRET/);
  });

  it("gagal saat ENCRYPTION_KEY bukan hex 64 karakter", async () => {
    process.env.ENCRYPTION_KEY = "xyz";
    await expect(import("@/lib/config/env")).rejects.toThrow(/ENCRYPTION_KEY/);
  });

  it("gagal saat ALLOWED_EMAILS kosong", async () => {
    process.env.ALLOWED_EMAILS = " , ";
    await expect(import("@/lib/config/env")).rejects.toThrow(/ALLOWED_EMAILS/);
  });
});
