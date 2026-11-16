import "server-only";
import { withUser } from "@/server/db/tx";
import { findDayLog, listDayLogsInRange } from "@/server/db/repositories/day-logs";
import {
  insertSnapshot,
  listChecklistForDate,
  listChecklistInRange,
  setItemDone,
  type ChecklistRow,
} from "@/server/db/repositories/checklist";
import { listPlanItems, type PlanItemRow } from "@/server/db/repositories/weekly-plan";
import { doneState, itemsForWeekday } from "@/domain/checklist/rules";
import { scoreChecklistDay, type ChecklistEntry } from "@/domain/scoring/checklist";
import { DAY_STATUSES, type DayScore, type DayStatus } from "@/domain/scoring/types";
import { addDays, isoWeekday } from "@/domain/time/logical-date";
import { DomainError } from "./errors";
import { parse } from "./parse";
import { SetChecklistItemInput } from "@/server/validation/daily-tracker";

export interface ChecklistItemView {
  /** Row id. For a live (not yet frozen) day this is the plan item id. */
  readonly id: string;
  /** Plan item id. Null when the source item was deleted after the day was frozen. */
  readonly sourceItemId: string | null;
  readonly title: string;
  readonly category: string;
  readonly isRequired: boolean;
  readonly isCore: boolean;
  readonly plannedMinutes: number | null;
  readonly isDone: boolean;
  readonly doneAt: string | null;
}

export interface ChecklistView {
  readonly logDate: string;
  readonly status: DayStatus;
  /** True once the first item of the day has been checked and the snapshot exists. */
  readonly frozen: boolean;
  readonly items: ChecklistItemView[];
}

function fromPlan(row: PlanItemRow): ChecklistItemView {
  return {
    id: row.id,
    sourceItemId: row.id,
    title: row.title,
    category: row.category,
    isRequired: row.isRequired,
    isCore: row.isCore,
    plannedMinutes: row.plannedMinutes,
    isDone: false,
    doneAt: null,
  };
}

function fromEntry(row: ChecklistRow): ChecklistItemView {
  return {
    id: row.id,
    sourceItemId: row.sourceItemId,
    title: row.title,
    category: row.category,
    isRequired: row.isRequired,
    isCore: row.isCore,
    plannedMinutes: row.plannedMinutes,
    isDone: row.isDone,
    doneAt: row.doneAt ? row.doneAt.toISOString() : null,
  };
}

function statusOf(value: string | undefined): DayStatus {
  return DAY_STATUSES.find((status) => status === value) ?? "NORMAL";
}

export async function getChecklist(userId: string, logDate: string): Promise<ChecklistView> {
  return withUser(userId, async (tx) => {
    const [log, entries, plan] = await Promise.all([
      findDayLog(tx, userId, logDate),
      listChecklistForDate(tx, userId, logDate),
      listPlanItems(tx, userId),
    ]);
    const status = statusOf(log?.status);

    if (entries.length > 0) {
      return { logDate, status, frozen: true, items: entries.map(fromEntry) };
    }

    const weekday = isoWeekday(logDate);
    return {
      logDate,
      status,
      frozen: false,
      items: itemsForWeekday(plan, weekday).map(fromPlan),
    };
  });
}

/**
 * Sets one item to done or not done. On the first call for a day, the whole day is copied
 * from the weekly plan first. Requests are idempotent because the desired state is sent.
 */
export async function setChecklistItem(userId: string, input: unknown): Promise<void> {
  const parsed = parse(SetChecklistItemInput, input);

  await withUser(userId, async (tx) => {
    let entries = await listChecklistForDate(tx, userId, parsed.logDate);

    if (entries.length === 0) {
      const plan = await listPlanItems(tx, userId);
      const items = itemsForWeekday(plan, isoWeekday(parsed.logDate));
      await insertSnapshot(
        tx,
        items.map((item) => ({
          userId,
          logDate: parsed.logDate,
          sourceItemId: item.id,
          title: item.title,
          category: item.category,
          isRequired: item.isRequired,
          isCore: item.isCore,
          plannedMinutes: item.plannedMinutes,
          position: item.position,
        })),
      );
      entries = await listChecklistForDate(tx, userId, parsed.logDate);
    }

    const target = entries.find((row) => row.sourceItemId === parsed.sourceItemId);
    if (!target) throw new DomainError("NOT_FOUND", "Checklist item not found");

    const state = doneState(parsed.done, new Date());
    await setItemDone(tx, userId, parsed.logDate, parsed.sourceItemId, state.isDone, state.doneAt);
  });
}

/**
 * Score per day for a date range. A frozen day uses its snapshot. A day that was never
 * checked uses the current plan, so its score is 0 until something is checked.
 */
export async function getChecklistScores(
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<DayScore[]> {
  return withUser(userId, async (tx) => {
    const [logs, entries, plan] = await Promise.all([
      listDayLogsInRange(tx, userId, fromDate, toDate),
      listChecklistInRange(tx, userId, fromDate, toDate),
      listPlanItems(tx, userId),
    ]);

    const statusByDate = new Map<string, DayStatus>(
      logs.map((log): [string, DayStatus] => [log.logDate, statusOf(log.status)]),
    );

    const entriesByDate = new Map<string, ChecklistRow[]>();
    for (const row of entries) {
      const bucket = entriesByDate.get(row.logDate) ?? [];
      bucket.push(row);
      entriesByDate.set(row.logDate, bucket);
    }

    const scores: DayScore[] = [];
    for (let date = fromDate; date <= toDate; date = addDays(date, 1)) {
      const status = statusByDate.get(date) ?? "NORMAL";
      const frozen = entriesByDate.get(date);

      const checklist: ChecklistEntry[] = frozen
        ? frozen.map((row) => ({ required: row.isRequired, core: row.isCore, done: row.isDone }))
        : itemsForWeekday(plan, isoWeekday(date)).map((item) => ({
            required: item.isRequired,
            core: item.isCore,
            done: false,
          }));

      scores.push(scoreChecklistDay(date, status, checklist));
    }
    return scores;
  });
}
