import "server-only";
import { eq } from "drizzle-orm";
import { env } from "@/lib/config/env";
import { hashPin, verifyPin } from "@/lib/crypto/pin";
import { privatePin } from "@/lib/db/schema";
import { withUser } from "@/lib/db/tx";
import { MAX_ATTEMPTS_BEFORE_LOCK, computeLockUntil } from "./lockout";

export type UnlockResult =
  | { status: "ok" }
  | { status: "wrong"; attemptsLeft: number }
  | { status: "locked"; until: Date }
  | { status: "no-pin" };

export async function hasPrivatePin(userId: string): Promise<boolean> {
  return withUser(userId, async (tx) => {
    const rows = await tx
      .select({ userId: privatePin.userId })
      .from(privatePin)
      .where(eq(privatePin.userId, userId))
      .limit(1);
    return rows.length > 0;
  });
}

/** Creates the PIN once. Returns false if a PIN already exists. */
export async function setPrivatePin(userId: string, pin: string): Promise<boolean> {
  const pinHash = await hashPin(pin, env.PRIVATE_PIN_PEPPER);
  return withUser(userId, async (tx) => {
    const inserted = await tx
      .insert(privatePin)
      .values({ userId, pinHash })
      .onConflictDoNothing()
      .returning({ userId: privatePin.userId });
    return inserted.length === 1;
  });
}

/** Checks a PIN attempt, updates the failure counter, and applies the lockout. */
export async function checkPrivatePin(
  userId: string,
  pin: string,
  now: Date = new Date(),
): Promise<UnlockResult> {
  return withUser(userId, async (tx): Promise<UnlockResult> => {
    const [row] = await tx
      .select()
      .from(privatePin)
      .where(eq(privatePin.userId, userId))
      .for("update")
      .limit(1);

    if (!row) return { status: "no-pin" };

    if (row.lockedUntil && row.lockedUntil > now) {
      return { status: "locked", until: row.lockedUntil };
    }

    const ok = await verifyPin(pin, row.pinHash, env.PRIVATE_PIN_PEPPER);

    if (ok) {
      if (row.failedAttempts !== 0 || row.lockedUntil !== null) {
        await tx
          .update(privatePin)
          .set({ failedAttempts: 0, lockedUntil: null, updatedAt: now })
          .where(eq(privatePin.userId, userId));
      }
      return { status: "ok" };
    }

    const failed = row.failedAttempts + 1;
    const lockUntil = computeLockUntil(failed, now);
    await tx
      .update(privatePin)
      .set({ failedAttempts: failed, lockedUntil: lockUntil, updatedAt: now })
      .where(eq(privatePin.userId, userId));

    if (lockUntil) return { status: "locked", until: lockUntil };
    return { status: "wrong", attemptsLeft: MAX_ATTEMPTS_BEFORE_LOCK - failed };
  });
}
