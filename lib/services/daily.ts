import "server-only";
import { withUser } from "@/lib/db/tx";
import { findDayLog, listDayLogsInRange, upsertDayLog } from "@/lib/db/repositories/day-logs";
import {
  listActiveHabits,
  listChecksForDate,
  upsertCheck,
  insertHabitIfMissing,
  insertHabit,
  findHabitById,
} from "@/lib/db/repositories/habits";
import {
  insertBlocks,
  listBlocksForDate,
  softDeleteBlock,
} from "@/lib/db/repositories/time-blocks";
import { DEFAULT_HABITS } from "./default-habits";
import { DomainError } from "./errors";
import {
  CreateHabitInput,
  CreateTimeBlockInput,
  HabitCheckInput,
  SetDayStatusInput,
} from "@/lib/validation/daily";
import { splitBlock } from "@/lib/time/split-block";
import { addDays } from "@/lib/time/logical-date";
import type { DayStatus, HabitDefinition } from "@/lib/scoring/types";
import type { DayRecord } from "@/lib/scoring/types";
import { habits as habitsTable } from "@/lib/db/schema";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { and, eq, gte, lte } from "drizzle-orm";
import { habitChecks } from "@/lib/db/schema";

const habitIdSchema = z.uuid();

/* ---------- Seed ---------- */

/** Ensures the default habits exist for the user. Idempotent and safe to call on every login. */
export async function ensureDefaultHabits(userId: string): Promise<void> {
  await withUser(userId, async (tx) => {
    for (const habit of DEFAULT_HABITS) {
      await insertHabitIfMissing(tx, {
        userId,
        key: habit.key,
        name: habit.name,
        category: habit.category,
        kind: habit.kind,
        target: habit.target,
        offDayCore: habit.offDayCore,
      });
    }
  });
}

/* ---------- Day status ---------- */

export async function setDayStatus(userId: string, input: unknown): Promise<void> {
  const parsed = parse(SetDayStatusInput, input);
  await withUser(userId, (tx) =>
    upsertDayLog(tx, { userId, logDate: parsed.logDate, status: parsed.status }),
  );
}

/* ---------- Habit checks ---------- */

/**
 * Records the value for one habit on one day.
 * Rejects habits that are archived or belong to another user (RLS hides them, so they are not found).
 */
export async function setHabitCheck(userId: string, input: unknown): Promise<void> {
  const parsed = parse(HabitCheckInput, input);
  await withUser(userId, async (tx) => {
    const habit = await findHabitById(tx, userId, parsed.habitId);
    if (!habit) throw new DomainError("NOT_FOUND", "Habit not found");
    if (habit.archivedAt) throw new DomainError("HABIT_ARCHIVED", "Habit is archived");

    const value = habit.kind === "BINARY" ? (parsed.value >= 1 ? 1 : 0) : parsed.value;
    await upsertCheck(tx, {
      userId,
      habitId: habit.id,
      logDate: parsed.logDate,
      value,
      source: "MANUAL",
    });
  });
}

/* ---------- Habits ---------- */

export async function createHabit(userId: string, input: unknown): Promise<string> {
  const parsed = parse(CreateHabitInput, input);
  return withUser(userId, async (tx) => {
    const row = await insertHabit(tx, {
      userId,
      key: parsed.key,
      name: parsed.name,
      category: parsed.category,
      kind: parsed.kind,
      target: parsed.target,
      offDayCore: parsed.offDayCore,
    }).catch((error: unknown) => {
      if (isUniqueViolation(error)) {
        throw new DomainError("CONFLICT", "A habit with this key already exists");
      }
      throw error;
    });
    return row.id;
  });
}

export async function archiveHabit(userId: string, habitId: string): Promise<void> {
  const id = parse(habitIdSchema, habitId);
  await withUser(userId, async (tx) => {
    const habit = await findHabitById(tx, userId, id);
    if (!habit) throw new DomainError("NOT_FOUND", "Habit not found");
    await tx
      .update(habitsTable)
      .set({ archivedAt: new Date(), active: false })
      .where(eq(habitsTable.id, id));
  });
}

/* ---------- Time blocks ---------- */

/**
 * Creates a time block. A block that crosses midnight is stored as two rows,
 * one per logical day, linked by a shared splitGroupId.
 */
export async function createTimeBlock(userId: string, input: unknown): Promise<string> {
  const parsed = parse(CreateTimeBlockInput, input);
  const segments = splitBlock(parsed.logDate, parsed.startMinute, parsed.durationMinutes);
  const splitGroupId = segments.length > 1 ? randomUUID() : null;

  return withUser(userId, async (tx) => {
    if (parsed.habitId) {
      const habit = await findHabitById(tx, userId, parsed.habitId);
      if (!habit) throw new DomainError("NOT_FOUND", "Habit not found");
    }

    const rows = await insertBlocks(
      tx,
      segments.map((segment) => ({
        userId,
        logDate: segment.logDate,
        startMinute: segment.startMinute,
        endMinute: segment.endMinute,
        category: parsed.category,
        activity: parsed.activity,
        habitId: parsed.habitId ?? null,
        splitGroupId,
        source: parsed.source,
      })),
    );

    return rows[0]?.id ?? "";
  });
}

export async function deleteTimeBlock(userId: string, blockId: string): Promise<void> {
  const id = parse(habitIdSchema, blockId);
  await withUser(userId, async (tx) => {
    const removed = await softDeleteBlock(tx, userId, id);
    if (!removed) throw new DomainError("NOT_FOUND", "Time block not found");
  });
}

/* ---------- Reads ---------- */

/** Everything the Today page needs for one logical day, in one transaction. */
export async function getDayView(userId: string, logDate: string) {
  return withUser(userId, async (tx) => {
    const [log, blocks, checks, habits] = await Promise.all([
      findDayLog(tx, userId, logDate),
      listBlocksForDate(tx, userId, logDate),
      listChecksForDate(tx, userId, logDate),
      listActiveHabits(tx, userId),
    ]);
    return {
      logDate,
      status: (log?.status ?? "NORMAL") as DayStatus,
      blocks,
      checks,
      habits,
    };
  });
}

/**
 * Builds the scoring input for a date range. Days without a day log default to NORMAL.
 * Output is pure input for lib/scoring: no scoring happens here.
 */
export async function getScoringInput(
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<{ habits: HabitDefinition[]; days: DayRecord[] }> {
  return withUser(userId, async (tx) => {
    const [habitRows, logs, checks] = await Promise.all([
      listActiveHabits(tx, userId),
      listDayLogsInRange(tx, userId, fromDate, toDate),
      tx
        .select()
        .from(habitChecks)
        .where(
          and(
            eq(habitChecks.userId, userId),
            gte(habitChecks.logDate, fromDate),
            lte(habitChecks.logDate, toDate),
          ),
        ),
    ]);

    const habits: HabitDefinition[] = habitRows.map((h) => ({
      id: h.id,
      category: h.category as HabitDefinition["category"],
      kind: h.kind as HabitDefinition["kind"],
      target: h.target,
      active: h.active,
      offDayCore: h.offDayCore,
    }));

    const logByDate = new Map(logs.map((l) => [l.logDate, l.status as DayStatus]));
    const inputsByDate = new Map<string, Record<string, number>>();
    for (const check of checks) {
      const bucket = inputsByDate.get(check.logDate) ?? {};
      bucket[check.habitId] = check.value;
      inputsByDate.set(check.logDate, bucket);
    }

    const days: DayRecord[] = [];
    for (let d = fromDate; d <= toDate; d = addDays(d, 1)) {
      days.push({
        date: d,
        status: logByDate.get(d) ?? "NORMAL",
        inputs: inputsByDate.get(d) ?? {},
      });
    }
    return { habits, days };
  });
}

/* ---------- Helpers ---------- */

function parse<T>(schema: { parse: (value: unknown) => T }, value: unknown): T {
  try {
    return schema.parse(value);
  } catch {
    throw new DomainError("VALIDATION_FAILED", "Input is invalid");
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "23505"
  );
}
