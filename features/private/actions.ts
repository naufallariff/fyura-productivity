"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/server/auth/auth";
import { requireUser } from "@/server/auth/session";
import { clearPrivateSession, grantPrivateSession } from "@/server/private/cookie";
import { checkPrivatePin, setPrivatePin } from "@/server/private/gate";
import { getPrivateExpiry } from "@/server/private/guard";
import { getLockoutCountdown } from "@/server/private/lockout";

/** The server sends codes only. The UI translates them, so no display text lives here. */
export type PinErrorCode = "FORMAT" | "ALREADY_SET" | "WRONG" | "NO_PIN" | "GENERIC";

export type PinLockout = {
  status: "error";
  code: "LOCKED";
  lockedUntil: number;
  secondsLeft: number;
};

export type PinActionState =
  { status: "idle" } | PinLockout | { status: "error"; code: PinErrorCode; attemptsLeft?: number };

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
    case "locked":
      return { status: "error", code: "LOCKED", ...getLockoutCountdown(result.until) };
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
 * Returns the new expiry or null when the user has to unlock again.
 */
export async function touchPrivateAction(): Promise<number | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || (await getPrivateExpiry(userId)) === null) return null;
  return grantPrivateSession(userId);
}
