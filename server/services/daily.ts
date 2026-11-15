// server/services/daily.ts
import "server-only";
import { randomUUID } from "node:crypto";
import type { ZodType } from "zod";
import { z } from "zod";
import { withUser } from "@/server/db/tx";
import { findDayLog, upsertDayLog } from "@/server/db/repositories/day-logs";
import {
  findBlockById,
  insertBlocks,
  listBlocksForDate,
  softDeleteBlockGroup,
  updateBlockTiming,
} from "@/server/db/repositories/time-blocks";
import { DomainError } from "./errors";
import {
  CreateTimeBlockInput,
  MoveTimeBlockInput,
  SetDayStatusInput,
} from "@/server/validation/daily";
import { splitBlock } from "@/domain/time/split-block";
import type { DayStatus } from "@/domain/scoring/types";

const idSchema = z.uuid();

/** Validates input at the boundary. Expected failures become DomainError. Other errors propagate. */
function parse<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new DomainError("VALIDATION_FAILED", "Input is invalid");
  }
  return result.data;
}

export async function setDayStatus(userId: string, input: unknown): Promise<void> {
  const parsed = parse(SetDayStatusInput, input);
  await withUser(userId, (tx) =>
    upsertDayLog(tx, { userId, logDate: parsed.logDate, status: parsed.status }),
  );
}

/**
 * Creates a block. A block that crosses midnight is stored as two linked rows.
 * Overlap is checked for every segment before anything is inserted.
 */
export async function createTimeBlock(userId: string, input: unknown): Promise<string> {
  const parsed = parse(CreateTimeBlockInput, input);
  const segments = splitBlock(parsed.logDate, parsed.startMinute, parsed.durationMinutes);
  const splitGroupId = segments.length > 1 ? randomUUID() : null;

  return withUser(userId, async (tx) => {
    for (const segment of segments) {
      const sameDay = await listBlocksForDate(tx, userId, segment.logDate);
      const clash = sameDay.some(
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
        splitGroupId,
        source: parsed.source,
      })),
    );
    return rows[0]?.id ?? "";
  });
}

/** Moves or resizes a single-day block. Blocks that cross midnight are edited as a pair in the dialog. */
export async function moveTimeBlock(userId: string, input: unknown): Promise<void> {
  const parsed = parse(MoveTimeBlockInput, input);

  await withUser(userId, async (tx) => {
    const block = await findBlockById(tx, userId, parsed.blockId);
    if (!block) throw new DomainError("NOT_FOUND", "Time block not found");
    if (block.splitGroupId) {
      throw new DomainError("CONFLICT", "Blocks that cross midnight are edited in the dialog");
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
  });
}

export async function deleteTimeBlock(userId: string, blockId: string): Promise<void> {
  const id = parse(idSchema, blockId);
  await withUser(userId, async (tx) => {
    const dates = await softDeleteBlockGroup(tx, userId, id);
    if (dates.length === 0) throw new DomainError("NOT_FOUND", "Time block not found");
  });
}

export async function getDayView(userId: string, logDate: string) {
  return withUser(userId, async (tx) => {
    const [log, blocks] = await Promise.all([
      findDayLog(tx, userId, logDate),
      listBlocksForDate(tx, userId, logDate),
    ]);
    return {
      logDate,
      status: (log?.status ?? "NORMAL") as DayStatus,
      blocks,
    };
  });
}
