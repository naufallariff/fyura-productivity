import { describe, expect, it } from "vitest";
import {
  PRIVATE_SESSION_TTL_MS,
  createPrivateToken,
  verifyPrivateToken,
} from "@/lib/private/session";

const SECRET = "s".repeat(32);
const USER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const NOW = 1_700_000_000_000;

describe("private session token", () => {
  it("is valid for the same user within 10 minutes", () => {
    const token = createPrivateToken(USER, NOW, SECRET);
    expect(verifyPrivateToken(token, USER, NOW + 60_000, SECRET)).toBe(true);
  });

  it("expires after 10 minutes", () => {
    const token = createPrivateToken(USER, NOW, SECRET);
    expect(verifyPrivateToken(token, USER, NOW + PRIVATE_SESSION_TTL_MS, SECRET)).toBe(false);
  });

  it("is bound to the user who unlocked it", () => {
    const token = createPrivateToken(USER, NOW, SECRET);
    expect(verifyPrivateToken(token, OTHER, NOW, SECRET)).toBe(false);
  });

  it("rejects a token signed with a different secret", () => {
    const token = createPrivateToken(USER, NOW, SECRET);
    expect(verifyPrivateToken(token, USER, NOW, "x".repeat(32))).toBe(false);
  });

  it("rejects a token whose expiry was edited", () => {
    const token = createPrivateToken(USER, NOW, SECRET);
    const [, signature] = token.split(".");
    const forged = `${NOW + 9 * PRIVATE_SESSION_TTL_MS}.${signature}`;
    expect(verifyPrivateToken(forged, USER, NOW, SECRET)).toBe(false);
  });

  it("rejects missing or malformed tokens", () => {
    expect(verifyPrivateToken(undefined, USER, NOW, SECRET)).toBe(false);
    expect(verifyPrivateToken("", USER, NOW, SECRET)).toBe(false);
    expect(verifyPrivateToken("abc.def", USER, NOW, SECRET)).toBe(false);
  });
});
