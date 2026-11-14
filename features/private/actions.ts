"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { requireUser } from "@/lib/auth/session";
import { clearPrivateSession, grantPrivateSession } from "@/lib/private/cookie";
import { checkPrivatePin, setPrivatePin } from "@/lib/private/gate";
import { env } from "@/lib/config/env";
import { PRIVATE_COOKIE_NAME, verifyPrivateToken } from "@/lib/private/session";
import { cookies } from "next/headers";

export type PinActionState = { status: "idle" } | { status: "error"; message: string };

const PinSchema = z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits.");

function readPin(formData: FormData) {
  return PinSchema.safeParse(String(formData.get("pin") ?? ""));
}

export async function setupPinAction(
  _previous: PinActionState,
  formData: FormData,
): Promise<PinActionState> {
  const user = await requireUser();

  const parsed = readPin(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid PIN." };
  }

  const created = await setPrivatePin(user.id, parsed.data);
  if (!created) {
    return { status: "error", message: "A PIN is already set for this account." };
  }

  await grantPrivateSession(user.id);
  redirect("/private");
}

export async function unlockPrivateAction(
  _previous: PinActionState,
  formData: FormData,
): Promise<PinActionState> {
  const user = await requireUser();

  const parsed = readPin(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid PIN." };
  }

  const result = await checkPrivatePin(user.id, parsed.data);

  switch (result.status) {
    case "ok":
      await grantPrivateSession(user.id);
      redirect("/private");
    case "wrong":
      return {
        status: "error",
        message: `Incorrect PIN. ${result.attemptsLeft} attempt(s) left before a short pause.`,
      };
    case "locked": {
      const minutes = Math.ceil((result.until.getTime() - Date.now()) / 60_000);
      return {
        status: "error",
        message: `Too many attempts. Try again in about ${minutes} minute(s).`,
      };
    }
    case "no-pin":
      return { status: "error", message: "No PIN is set yet." };
  }
}

export async function lockPrivateAction(): Promise<void> {
  await clearPrivateSession();
  redirect("/dashboard");
}

/**
 * Extends the private session while the user is active.
 * Returns false instead of redirecting, so the client can send the user to unlock.
 */
export async function touchPrivateAction(): Promise<boolean> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return false;

  const jar = await cookies();
  const token = jar.get(PRIVATE_COOKIE_NAME)?.value;
  if (!verifyPrivateToken(token, userId, Date.now(), env.AUTH_SECRET)) return false;

  await grantPrivateSession(userId);
  return true;
}
