"use server";

import { signOut } from "@/lib/auth/auth";
import { clearPrivateSession } from "@/lib/private/cookie";

export async function signOutAction(): Promise<void> {
  await clearPrivateSession();
  await signOut({ redirectTo: "/login" });
}
