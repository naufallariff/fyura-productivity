import { beforeEach, describe, expect, it, vi } from "vitest";
import { decryptColumn, encryptColumn } from "@/server/crypto/column-cipher";
import { DomainError } from "@/server/services/errors";

const { env } = vi.hoisted(() => ({
  env: { ENCRYPTION_KEY: undefined as string | undefined, ENCRYPTION_KEY_VERSION: 12 },
}));
vi.mock("@/server/config/env", () => ({ env }));

beforeEach(() => {
  env.ENCRYPTION_KEY = "ab".repeat(32);
  env.ENCRYPTION_KEY_VERSION = 12;
});

describe("column encryption", () => {
  it.each(["", "Catatan pribadi 🔒"])("round-trips %j", (plaintext) => {
    const ciphertext = encryptColumn(plaintext);
    expect(ciphertext).toMatch(/^v12:/);
    const payload = Buffer.from(ciphertext.slice(4), "base64");
    expect(payload.length).toBe(12 + Buffer.byteLength(plaintext) + 16);
    expect(decryptColumn(ciphertext)).toBe(plaintext);
  });

  it("generates a fresh IV for each encryption", () => {
    const first = Buffer.from(encryptColumn("same").slice(4), "base64");
    const second = Buffer.from(encryptColumn("same").slice(4), "base64");
    expect(first.subarray(0, 12)).not.toEqual(second.subarray(0, 12));
  });

  it("detects a changed authentication tag", () => {
    const payload = Buffer.from(encryptColumn("private").slice(4), "base64");
    payload.writeUInt8(payload.readUInt8(payload.length - 1) ^ 1, payload.length - 1);
    expect(() => decryptColumn(`v12:${payload.toString("base64")}`)).toThrow(/authentication/);
  });

  it("rejects malformed and unsupported key versions and authenticates the version", () => {
    const ciphertext = encryptColumn("private");
    const payload = ciphertext.slice(4);
    expect(() => decryptColumn(`v012:${payload}`)).toThrow(/format/);
    expect(() => decryptColumn(`v12:${payload}\n`)).toThrow(/format/);
    expect(() => decryptColumn(`v12:${payload}!`)).toThrow(/payload/);
    expect(() => decryptColumn(`v13:${payload}`)).toThrow(/unsupported key version/);
    env.ENCRYPTION_KEY_VERSION = 13;
    expect(() => decryptColumn(`v13:${payload}`)).toThrow(/authentication/);
  });

  it.each([undefined, "", "g".repeat(64), "ab".repeat(31)])(
    "reports an internal configuration error for key %j",
    (key) => {
      const ciphertext = encryptColumn("private");
      env.ENCRYPTION_KEY = key;
      for (const operation of [() => encryptColumn("private"), () => decryptColumn(ciphertext)]) {
        expect(operation).toThrow(DomainError);
        expect(operation).toThrow(
          expect.objectContaining({
            code: "INTERNAL",
            message: expect.stringContaining("ENCRYPTION_KEY"),
          }),
        );
      }
    },
  );
});
