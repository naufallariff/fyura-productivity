import { beforeEach, describe, expect, it, vi } from "vitest";

const SECRET = "c".repeat(32);
const { env } = vi.hoisted(() => ({ env: { CRON_SECRET: undefined as string | undefined } }));
vi.mock("@/server/config/env", () => ({ env }));

beforeEach(() => {
  env.CRON_SECRET = SECRET;
  vi.resetModules();
});

describe("cron authorization", () => {
  it("accepts the correct bearer secret", async () => {
    const { isAuthorizedCron } = await import("@/server/cron/auth");
    expect(isAuthorizedCron(`Bearer ${SECRET}`)).toBe(true);
  });

  it("rejects a missing header", async () => {
    const { isAuthorizedCron } = await import("@/server/cron/auth");
    expect(isAuthorizedCron(null)).toBe(false);
  });

  it("rejects a wrong secret", async () => {
    const { isAuthorizedCron } = await import("@/server/cron/auth");
    expect(isAuthorizedCron(`Bearer ${"x".repeat(32)}`)).toBe(false);
  });

  it("rejects the secret without the Bearer prefix", async () => {
    const { isAuthorizedCron } = await import("@/server/cron/auth");
    expect(isAuthorizedCron(SECRET)).toBe(false);
  });

  it.each([undefined, "", " ".repeat(32)])("rejects secret %j at module load", async (secret) => {
    env.CRON_SECRET = secret;
    await expect(import("@/server/cron/auth")).rejects.toThrow(/CRON_SECRET must be non-empty/);
  });
});
