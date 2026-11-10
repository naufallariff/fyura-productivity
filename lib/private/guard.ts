import "server-only";
import { cookies } from "next/headers";
import { env } from "@/lib/config/env";
import { PRIVATE_COOKIE_NAME, readPrivateExpiry } from "./session";

/** Returns the private session expiry for this user, or null when locked. Never redirects. */
export async function getPrivateExpiry(userId: string): Promise<number | null> {
  const jar = await cookies();
  const token = jar.get(PRIVATE_COOKIE_NAME)?.value;
  return readPrivateExpiry(token, userId, Date.now(), env.AUTH_SECRET);
}
