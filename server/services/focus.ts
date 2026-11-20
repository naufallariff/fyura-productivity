// server/services/focus.ts
import "server-only";
import { z } from "zod";
import { withUser, type Tx } from "@/server/db/tx";
import { insertFocusSession, listRecentFocus, type FocusRow } from "@/server/db/repositories/focus";
import { placeBlock } from "@/server/services/daily";
import { DomainError } from "@/server/services/errors";
import { parse } from "@/server/services/parse";
import {
  countsAsDeepWork,
  elapsedMinutes,
  FOCUS_MAX_MINUTES,
  FOCUS_MIN_MINUTES,
  type FocusKind,
} from "@/domain/focus/session";
import { isValidIsoDate } from "@/domain/time/local-date";

/** Allows a small clock difference between the device and the server. */
const CLOCK_TOLERANCE_MS = 5 * 60_000;

const LogFocusInput = z
  .object({
    logDate: z.string().refine(isValidIsoDate, "Date must be a real calendar date"),
    kind: z.enum(["DEEP", "LIGHT"]),
    plannedMinutes: z.number().int().min(FOCUS_MIN_MINUTES).max(FOCUS_MAX_MINUTES),
    startedAt: z.iso.datetime(),
    endedAt: z.iso.datetime(),
    startMinute: z.number().int().min(0).max(1439),
  })
  .strict()
  .refine((value) => Date.parse(value.endedAt) >= Date.parse(value.startedAt), {
    message: "endedAt must not be before startedAt",
    path: ["endedAt"],
  })
  .refine((value) => Date.parse(value.endedAt) <= Date.now() + CLOCK_TOLERANCE_MS, {
    message: "endedAt is in the future",
    path: ["endedAt"],
  });

export interface FocusLogResult {
  readonly completed: boolean;
  readonly actualMinutes: number;
  readonly blockCreated: boolean;
}

export interface FocusSessionView {
  readonly id: string;
  readonly logDate: string;
  readonly startedAt: string;
  readonly plannedMinutes: number;
  readonly actualMinutes: number;
  readonly kind: FocusKind;
  readonly completed: boolean;
}

/**
 * Records a focus session. The session is always stored. A completed DEEP session also
 * tries to add a Deep work block. A clash keeps the session and skips the block.
 */
export async function logFocusSession(userId: string, input: unknown): Promise<FocusLogResult> {
  const parsed = parse(LogFocusInput, input);
  const startedAt = new Date(parsed.startedAt);
  const endedAt = new Date(parsed.endedAt);

  // Elapsed time is capped at the planned length, so the server decides the final amount.
  const actualMinutes = Math.min(
    elapsedMinutes(startedAt.getTime(), endedAt.getTime()),
    parsed.plannedMinutes,
  );
  const completed = actualMinutes >= parsed.plannedMinutes;

  return withUser(userId, async (tx) => {
    await insertFocusSession(tx, {
      userId,
      logDate: parsed.logDate,
      startedAt,
      plannedMinutes: parsed.plannedMinutes,
      actualMinutes,
      kind: parsed.kind,
      completed,
    });

    const blockCreated = countsAsDeepWork(parsed.kind, completed)
      ? await tryPlaceDeepWorkBlock(tx, userId, parsed.logDate, parsed.startMinute, actualMinutes)
      : false;

    return { completed, actualMinutes, blockCreated };
  });
}

async function tryPlaceDeepWorkBlock(
  tx: Tx,
  userId: string,
  logDate: string,
  startMinute: number,
  durationMinutes: number,
): Promise<boolean> {
  try {
    await placeBlock(tx, userId, {
      logDate,
      startMinute,
      durationMinutes,
      category: "WORK",
      activity: "Deep work",
      source: "TIMER",
    });
    return true;
  } catch (error) {
    // A clash is an expected outcome. The session stays recorded without the block.
    if (error instanceof DomainError && error.code === "CONFLICT") return false;
    throw error;
  }
}

export async function recentFocusSessions(userId: string, limit = 10): Promise<FocusSessionView[]> {
  const size = Math.min(Math.max(limit, 1), 50);
  const rows = await withUser(userId, (tx) => listRecentFocus(tx, userId, size));
  return rows.map(toView);
}

function toView(row: FocusRow): FocusSessionView {
  return {
    id: row.id,
    logDate: row.logDate,
    startedAt: row.startedAt.toISOString(),
    plannedMinutes: row.plannedMinutes,
    actualMinutes: row.actualMinutes,
    kind: row.kind as FocusKind,
    completed: row.completed,
  };
}
