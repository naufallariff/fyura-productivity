import "server-only";
import { z } from "zod";
import { withUser } from "@/lib/db/tx";
import { insertFocusSession, listRecentFocus } from "@/lib/db/repositories/focus";
import { insertBlocks } from "@/lib/db/repositories/time-blocks";
import { syncBlockHabits } from "@/lib/services/daily";
import { DomainError } from "./errors";
import { countsAsDeepWork, elapsedMinutes } from "@/lib/focus/session";

const LogFocusInput = z
  .object({
    logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    kind: z.enum(["DEEP", "LIGHT"]),
    plannedMinutes: z.union([z.literal(25), z.literal(50), z.literal(90)]),
    startedAt: z.iso.datetime(),
    endedAt: z.iso.datetime(),
    startMinute: z.number().int().min(0).max(1439),
  })
  .strict();

/**
 * Records a finished or abandoned focus session. Completed DEEP sessions also
 * create a Deep work block on the same logical day, so output and Today stay consistent.
 */
export async function logFocusSession(userId: string, input: unknown): Promise<void> {
  const parsed = parseLog(input);
  const startedAt = new Date(parsed.startedAt);
  const endedAt = new Date(parsed.endedAt);
  const actual = Math.min(
    elapsedMinutes(startedAt.getTime(), endedAt.getTime()),
    parsed.plannedMinutes,
  );
  const completed = actual >= parsed.plannedMinutes;

  await withUser(userId, async (tx) => {
    await insertFocusSession(tx, {
      userId,
      logDate: parsed.logDate,
      startedAt,
      plannedMinutes: parsed.plannedMinutes,
      actualMinutes: actual,
      kind: parsed.kind,
      completed,
    });

    if (countsAsDeepWork(parsed.kind, completed)) {
      const startMinute = parsed.startMinute;
      await insertBlocks(tx, [
        {
          userId,
          logDate: parsed.logDate,
          startMinute,
          endMinute: Math.min(1440, startMinute + actual),
          category: "WORK",
          activity: "Deep work",
          source: "TIMER",
        },
      ]);
      await syncBlockHabits(tx, userId, parsed.logDate);
    }
  });
}

export async function recentFocusSessions(userId: string, limit = 10) {
  return withUser(userId, (tx) => listRecentFocus(tx, userId, limit));
}

function parseLog(input: unknown) {
  try {
    return LogFocusInput.parse(input);
  } catch {
    throw new DomainError("VALIDATION_FAILED", "Input is invalid");
  }
}
