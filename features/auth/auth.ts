"use server";

import { signOut } from "@/server/auth/auth";
import { clearPrivateSession } from "@/server/private/cookie";

export async function signOutAction(): Promise<void> {
  await clearPrivateSession();
  await signOut({ redirectTo: "/login" });
}
