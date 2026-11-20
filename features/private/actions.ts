"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/server/auth/auth";
import { requireUser } from "@/server/auth/session";
import { env } from "@/server/config/env";
import { clearPrivateSession, grantPrivateSession } from "@/server/private/cookie";
import { checkPrivatePin, setPrivatePin } from "@/server/private/gate";
import { PRIVATE_COOKIE_NAME, verifyPrivateToken } from "@/server/private/session";

/** The server sends codes only. The UI translates them, so no display text lives here. */
export type PinErrorCode = "FORMAT" | "ALREADY_SET" | "WRONG" | "LOCKED" | "NO_PIN" | "GENERIC";

export type PinActionState =
  | { status: "idle" }
  | { status: "error"; code: PinErrorCode; attemptsLeft?: number; minutes?: number };

const PinSchema = z.string().regex(/^\d{6}$/);

function readPin(formData: FormData): string | null {
  const parsed = PinSchema.safeParse(String(formData.get("pin") ?? ""));
  return parsed.success ? parsed.data : null;
}

export async function setupPinAction(
  _previous: PinActionState,
  formData: FormData,
): Promise<PinActionState> {
  const user = await requireUser();
  const pin = readPin(formData);
  if (pin === null) return { status: "error", code: "FORMAT" };

  const created = await setPrivatePin(user.id, pin);
  if (!created) return { status: "error", code: "ALREADY_SET" };

  await grantPrivateSession(user.id);
  redirect("/private");
}

export async function unlockPrivateAction(
  _previous: PinActionState,
  formData: FormData,
): Promise<PinActionState> {
  const user = await requireUser();
  const pin = readPin(formData);
  if (pin === null) return { status: "error", code: "FORMAT" };

  const result = await checkPrivatePin(user.id, pin);

  switch (result.status) {
    case "ok":
      await grantPrivateSession(user.id);
      redirect("/private");
    case "wrong":
      return { status: "error", code: "WRONG", attemptsLeft: result.attemptsLeft };
    case "locked": {
      const minutes = Math.max(1, Math.ceil((result.until.getTime() - Date.now()) / 60_000));
      return { status: "error", code: "LOCKED", minutes };
    }
    case "no-pin":
      return { status: "error", code: "NO_PIN" };
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
