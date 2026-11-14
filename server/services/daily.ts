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
  softDeleteBlockGroup,
  findBlockById,
  updateBlockTiming,
} from "@/lib/db/repositories/time-blocks";
import { DEFAULT_HABITS } from "./default-habits";
import { DomainError } from "./errors";
import {
  CreateHabitInput,
  CreateTimeBlockInput,
  HabitCheckInput,
  SetDayStatusInput,
  MoveTimeBlockInput,
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
import type { Tx } from "@/lib/db/tx";
import { HABIT_RULES, deriveValue, type BlockFact } from "@/lib/habits/mapping";
import { toCategory } from "@/lib/habits/categories";
import { deleteCheck } from "@/lib/db/repositories/habits";

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

    // Reject overlaps for every segment before inserting anything.
    // The whole check and insert run in one transaction.
    for (const segment of segments) {
      const existing = await listBlocksForDate(tx, userId, segment.logDate);
      const clash = existing.find(
        (block) => segment.startMinute < block.endMinute && block.startMinute < segment.endMinute,
      );
      if (clash) throw new DomainError("CONFLICT", "Time block overlaps an existing block");
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

    for (const date of new Set(segments.map((segment) => segment.logDate))) {
      await syncBlockHabits(tx, userId, date);
    }

    return rows[0]?.id ?? "";
  });
}

/**
 * Moves or resizes a single-day block. Blocks that cross midnight are edited
 * through the form, because changing one segment alone would break the pair.
 */
export async function moveTimeBlock(userId: string, input: unknown): Promise<void> {
  const parsed = parse(MoveTimeBlockInput, input);

  await withUser(userId, async (tx) => {
    const block = await findBlockById(tx, userId, parsed.blockId);
    if (!block) throw new DomainError("NOT_FOUND", "Time block not found");
    if (block.splitGroupId) {
      throw new DomainError("CONFLICT", "Blocks that cross midnight are edited in the form");
    }

    const sameDay = await listBlocksForDate(tx, userId, block.logDate);
    const clash = sameDay.some(
      (other) =>
        other.id !== block.id &&
        parsed.startMinute < other.endMinute &&
        other.startMinute < parsed.endMinute,
    );
    if (clash) throw new DomainError("CONFLICT", "Time block overlaps an existing block");

    await updateBlockTiming(tx, userId, block.id, parsed.startMinute, parsed.endMinute);
    await syncBlockHabits(tx, userId, block.logDate);
  });
}

export async function deleteTimeBlock(userId: string, blockId: string): Promise<void> {
  const id = parse(habitIdSchema, blockId);
  await withUser(userId, async (tx) => {
    const dates = await softDeleteBlockGroup(tx, userId, id);
    if (dates.length === 0) throw new DomainError("NOT_FOUND", "Time block not found");
    for (const date of dates) {
      await syncBlockHabits(tx, userId, date);
    }
  });
}

/**
 * Recomputes block-derived habit values for one logical day.
 * MANUAL rows are never touched, so an explicit user entry always wins.
 * Runs inside the caller's transaction so blocks and checks change together.
 */
export async function syncBlockHabits(tx: Tx, userId: string, logDate: string): Promise<void> {
  const [blocks, habits, checks] = await Promise.all([
    listBlocksForDate(tx, userId, logDate),
    listActiveHabits(tx, userId),
    listChecksForDate(tx, userId, logDate),
  ]);

  const facts: BlockFact[] = blocks.map((block) => ({
    category: toCategory(block.category),
    activity: block.activity,
    minutes: block.endMinute - block.startMinute,
  }));
  const checkByHabit = new Map(checks.map((check) => [check.habitId, check]));

  for (const rule of HABIT_RULES) {
    const habit = habits.find((h) => h.key === rule.habitKey);
    if (!habit) continue;

    const existing = checkByHabit.get(habit.id);
    if (existing?.source === "MANUAL") continue;

    const value = deriveValue(rule, facts);
    if (value === 0) {
      if (existing) await deleteCheck(tx, userId, habit.id, logDate);
      continue;
    }
    if (existing && existing.value === value) continue;

    await upsertCheck(tx, { userId, habitId: habit.id, logDate, value, source: "BLOCK" });
  }
}

/* ---------- Reads ---------- */

export interface HabitBoardRow {
  id: string;
  key: string;
  name: string;
  kind: "BINARY" | "QUANTITY";
  target: number;
  value: number;
  source: "MANUAL" | "BLOCK" | null;
  automated: boolean;
}

/** Habit checklist for one logical day, with the source of each value. */
export async function getHabitBoard(userId: string, logDate: string): Promise<HabitBoardRow[]> {
  return withUser(userId, async (tx) => {
    const [habits, checks] = await Promise.all([
      listActiveHabits(tx, userId),
      listChecksForDate(tx, userId, logDate),
    ]);
    const byHabit = new Map(checks.map((check) => [check.habitId, check]));

    return habits.map((habit) => {
      const check = byHabit.get(habit.id);
      return {
        id: habit.id,
        key: habit.key,
        name: habit.name,
        kind: habit.kind as HabitBoardRow["kind"],
        target: habit.target,
        value: check?.value ?? 0,
        source: (check?.source as HabitBoardRow["source"]) ?? null,
        automated: HABIT_RULES.some((rule) => rule.habitKey === habit.key),
      };
    });
  });
}

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
      name: h.name,
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

/** 30 days ending on `today`. Enough for the trend and the previous-week comparison. */
export async function getDashboardInput(userId: string, today: string) {
  return getScoringInput(userId, addDays(today, -29), today);
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
