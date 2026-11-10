import { createHmac, timingSafeEqual } from "node:crypto";

export const PRIVATE_COOKIE_NAME = "fyura_private";
export const PRIVATE_SESSION_TTL_MS = 10 * 60_000;

function sign(userId: string, expiresAt: number, secret: string): string {
  return createHmac("sha256", secret).update(`private:${userId}:${expiresAt}`).digest("base64url");
}

export function createPrivateToken(userId: string, nowMs: number, secret: string): string {
  const expiresAt = nowMs + PRIVATE_SESSION_TTL_MS;
  return `${expiresAt}.${sign(userId, expiresAt, secret)}`;
}

export function verifyPrivateToken(
  token: string | undefined,
  userId: string,
  nowMs: number,
  secret: string,
): boolean {
  if (!token) return false;

  const [expiresRaw, signature] = token.split(".");
  const expiresAt = Number(expiresRaw);
  if (!Number.isSafeInteger(expiresAt) || !signature) return false;
  if (expiresAt <= nowMs) return false;

  const expected = Buffer.from(sign(userId, expiresAt, secret));
  const actual = Buffer.from(signature);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Returns the session expiry in epoch ms if the token is valid for this user, otherwise null. */
export function readPrivateExpiry(
  token: string | undefined,
  userId: string,
  nowMs: number,
  secret: string,
): number | null {
  if (!token || !verifyPrivateToken(token, userId, nowMs, secret)) return null;
  return Number(token.split(".")[0]);
}
