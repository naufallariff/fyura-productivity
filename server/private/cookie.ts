import "server-only";
import { cookies } from "next/headers";
import { env } from "@/lib/config/env";
import { PRIVATE_COOKIE_NAME, PRIVATE_SESSION_TTL_MS, createPrivateToken } from "./session";

/** Issues or renews the private session cookie. Renewal resets the 10-minute window. */
export async function grantPrivateSession(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(PRIVATE_COOKIE_NAME, createPrivateToken(userId, Date.now(), env.AUTH_SECRET), {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: PRIVATE_SESSION_TTL_MS / 1000,
  });
}

export async function clearPrivateSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(PRIVATE_COOKIE_NAME);
}
