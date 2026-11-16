import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ---------- Identity ---------- */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(), // always stored lowercase by the application
    name: text("name"),
    locale: text("locale").notNull().default("en"),
    timezone: text("timezone").notNull().default("Asia/Jakarta"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)],
);

/* ---------- Per-user settings ---------- */

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  themeBundle: text("theme_bundle").notNull().default("ocean"),
  themeMode: text("theme_mode").notNull().default("light"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------- Private space gate ---------- */

export const privatePin = pgTable("private_pin", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  pinHash: text("pin_hash").notNull(), // Argon2id hash, not reversible encryption
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------- Audit ---------- */

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // SET NULL keeps the history even if the user is deleted
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(), // e.g. 'theme.update', 'data.delete'
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    meta: jsonb("meta"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_user_at_idx").on(t.userId, t.at)],
);

/* ---------- Daily logs ---------- */

// One row per logical day. The status changes how the day is scored.
export const dayLogs = pgTable(
  "day_logs",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    logDate: date("log_date", { mode: "string" }).notNull(),
    status: text("status").notNull().default("NORMAL"),
    note: text("note"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.logDate] }),
    check("day_logs_status_chk", sql`${t.status} in ('NORMAL', 'SICK', 'FLEXIBLE', 'OFF')`),
  ],
);

/* ---------- Time blocks (free-form, minutes within one logical day) ---------- */

export const timeBlocks = pgTable(
  "time_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    logDate: date("log_date", { mode: "string" }).notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
    category: text("category").notNull(),
    activity: text("activity").notNull(),
    // Links the two halves of a block that crosses midnight
    splitGroupId: uuid("split_group_id"),
    source: text("source").notNull().default("MANUAL"), // 'MANUAL' | 'TIMER' | 'CHIP'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("time_blocks_user_day_idx").on(t.userId, t.logDate),
    check(
      "time_blocks_range_chk",
      sql`${t.startMinute} >= 0 and ${t.endMinute} <= 1440 and ${t.endMinute} > ${t.startMinute}`,
    ),
    check(
      "time_blocks_category_chk",
      sql`${t.category} in ('WORSHIP', 'LEARNING', 'WORK', 'CAREER', 'FITNESS', 'REST', 'SOCIAL', 'LEISURE')`,
    ),
    check("time_blocks_source_chk", sql`${t.source} in ('MANUAL', 'TIMER', 'CHIP')`),
  ],
);

/* ---------- Focus sessions ---------- */

export const focusSessions = pgTable(
  "focus_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    logDate: date("log_date", { mode: "string" }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    plannedMinutes: integer("planned_minutes").notNull(),
    actualMinutes: integer("actual_minutes").notNull(),
    kind: text("kind").notNull(), // 'DEEP' | 'LIGHT'
    completed: boolean("completed").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("focus_sessions_user_day_idx").on(t.userId, t.logDate),
    check("focus_sessions_kind_chk", sql`${t.kind} in ('DEEP', 'LIGHT')`),
    check(
      "focus_sessions_minutes_chk",
      sql`${t.plannedMinutes} between 1 and 240 and ${t.actualMinutes} >= 0 and ${t.actualMinutes} <= ${t.plannedMinutes}`,
    ),
  ],
);

/* ---------- Journal ---------- */

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    logDate: date("log_date", { mode: "string" }).notNull(),
    kind: text("kind").notNull(), // 'DAILY' | 'LEARNING' | 'ENGLISH' | 'COURSE' | 'FREE'
    title: text("title"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("journal_user_day_kind_idx").on(t.userId, t.logDate, t.kind),
    check("journal_kind_chk", sql`${t.kind} in ('DAILY', 'LEARNING', 'ENGLISH', 'COURSE', 'FREE')`),
    check("journal_body_chk", sql`char_length(${t.body}) between 1 and 20000`),
  ],
);

/* ---------- Weekly plan (template per weekday) ---------- */

// The template a daily checklist is built from. Weekday 1 is Monday, 7 is Sunday.
export const weeklyPlanItems = pgTable(
  "weekly_plan_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    isRequired: boolean("is_required").notNull().default(true),
    // Core items also apply on flexible and off days.
    isCore: boolean("is_core").notNull().default(false),
    plannedMinutes: integer("planned_minutes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("weekly_plan_items_user_day_idx")
      .on(t.userId, t.weekday, t.position)
      .where(sql`${t.deletedAt} is null`),
    check("weekly_plan_weekday_chk", sql`${t.weekday} between 1 and 7`),
    check("weekly_plan_position_chk", sql`${t.position} >= 0`),
    check("weekly_plan_title_chk", sql`char_length(${t.title}) between 1 and 120`),
    check(
      "weekly_plan_category_chk",
      sql`${t.category} in ('WORSHIP', 'LEARNING', 'WORK', 'CAREER', 'FITNESS', 'REST', 'SOCIAL', 'LEISURE')`,
    ),
    check(
      "weekly_plan_minutes_chk",
      sql`${t.plannedMinutes} is null or ${t.plannedMinutes} between 1 and 1440`,
    ),
  ],
);

/* ---------- Daily checklist (snapshot per logical day) ---------- */

// Created when the first item of a day is checked. It copies the weekly plan for that
// weekday, so later edits to the plan never rewrite a day that was already recorded.
export const checklistEntries = pgTable(
  "checklist_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    logDate: date("log_date", { mode: "string" }).notNull(),
    sourceItemId: uuid("source_item_id").references(() => weeklyPlanItems.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    category: text("category").notNull(),
    isRequired: boolean("is_required").notNull(),
    isCore: boolean("is_core").notNull(),
    plannedMinutes: integer("planned_minutes"),
    position: integer("position").notNull(),
    isDone: boolean("is_done").notNull().default(false),
    doneAt: timestamp("done_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("checklist_entries_day_source_uq").on(t.userId, t.logDate, t.sourceItemId),
    index("checklist_entries_user_day_idx").on(t.userId, t.logDate, t.position),
    check("checklist_title_chk", sql`char_length(${t.title}) between 1 and 120`),
    check(
      "checklist_category_chk",
      sql`${t.category} in ('WORSHIP', 'LEARNING', 'WORK', 'CAREER', 'FITNESS', 'REST', 'SOCIAL', 'LEISURE')`,
    ),
    check("checklist_position_chk", sql`${t.position} >= 0`),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
