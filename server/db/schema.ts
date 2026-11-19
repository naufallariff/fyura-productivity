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
  doublePrecision,
  foreignKey,
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

/* ---------- Projects (Trello-style boards) ---------- */

export const boards = pgTable(
  "boards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    hue: text("hue").notNull().default("indigo"),
    starred: boolean("starred").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("boards_id_user_uq").on(t.id, t.userId),
    index("boards_user_active_idx")
      .on(t.userId, t.updatedAt)
      .where(sql`${t.archivedAt} is null`),
    check("boards_title_chk", sql`char_length(${t.title}) between 1 and 80`),
    check(
      "boards_hue_chk",
      sql`${t.hue} in ('sky', 'violet', 'amber', 'rose', 'emerald', 'teal', 'orange', 'indigo')`,
    ),
  ],
);

export const boardLists = pgTable(
  "board_lists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    boardId: uuid("board_id").notNull(),
    title: text("title").notNull(),
    position: doublePrecision("position").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("board_lists_id_board_user_uq").on(t.id, t.boardId, t.userId),
    index("board_lists_board_pos_idx")
      .on(t.boardId, t.position)
      .where(sql`${t.archivedAt} is null`),
    foreignKey({
      name: "board_lists_board_owner_fk",
      columns: [t.boardId, t.userId],
      foreignColumns: [boards.id, boards.userId],
    }).onDelete("cascade"),
    check("board_lists_title_chk", sql`char_length(${t.title}) between 1 and 80`),
  ],
);

export const boardCards = pgTable(
  "board_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    boardId: uuid("board_id").notNull(),
    listId: uuid("list_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    position: doublePrecision("position").notNull(),
    dueOn: date("due_on", { mode: "string" }),
    dueComplete: boolean("due_complete").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("board_cards_id_board_user_uq").on(t.id, t.boardId, t.userId),
    index("board_cards_list_pos_idx")
      .on(t.listId, t.position)
      .where(sql`${t.archivedAt} is null`),
    index("board_cards_board_due_idx")
      .on(t.boardId, t.dueOn)
      .where(sql`${t.archivedAt} is null`),
    foreignKey({
      name: "board_cards_board_owner_fk",
      columns: [t.boardId, t.userId],
      foreignColumns: [boards.id, boards.userId],
    }).onDelete("cascade"),
    // The list must belong to the same board as the card. The database enforces it.
    foreignKey({
      name: "board_cards_list_board_fk",
      columns: [t.listId, t.boardId, t.userId],
      foreignColumns: [boardLists.id, boardLists.boardId, boardLists.userId],
    }).onDelete("cascade"),
    check("board_cards_title_chk", sql`char_length(${t.title}) between 1 and 200`),
    check(
      "board_cards_description_chk",
      sql`${t.description} is null or char_length(${t.description}) <= 10000`,
    ),
  ],
);

export const boardLabels = pgTable(
  "board_labels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    boardId: uuid("board_id").notNull(),
    name: text("name").notNull(),
    hue: text("hue").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("board_labels_id_board_user_uq").on(t.id, t.boardId, t.userId),
    uniqueIndex("board_labels_board_name_uq").on(t.boardId, t.name),
    foreignKey({
      name: "board_labels_board_owner_fk",
      columns: [t.boardId, t.userId],
      foreignColumns: [boards.id, boards.userId],
    }).onDelete("cascade"),
    check("board_labels_name_chk", sql`char_length(${t.name}) between 1 and 40`),
    check(
      "board_labels_hue_chk",
      sql`${t.hue} in ('sky', 'violet', 'amber', 'rose', 'emerald', 'teal', 'orange', 'indigo')`,
    ),
  ],
);

export const boardCardLabels = pgTable(
  "board_card_labels",
  {
    userId: uuid("user_id").notNull(),
    boardId: uuid("board_id").notNull(),
    cardId: uuid("card_id").notNull(),
    labelId: uuid("label_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.cardId, t.labelId] }),
    index("board_card_labels_label_idx").on(t.labelId),
    foreignKey({
      name: "board_card_labels_card_fk",
      columns: [t.cardId, t.boardId, t.userId],
      foreignColumns: [boardCards.id, boardCards.boardId, boardCards.userId],
    }).onDelete("cascade"),
    // A label can only be attached to a card on the same board.
    foreignKey({
      name: "board_card_labels_label_fk",
      columns: [t.labelId, t.boardId, t.userId],
      foreignColumns: [boardLabels.id, boardLabels.boardId, boardLabels.userId],
    }).onDelete("cascade"),
  ],
);

export const boardChecklistItems = pgTable(
  "board_checklist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    boardId: uuid("board_id").notNull(),
    cardId: uuid("card_id").notNull(),
    title: text("title").notNull(),
    isDone: boolean("is_done").notNull().default(false),
    position: doublePrecision("position").notNull(),
    doneAt: timestamp("done_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("board_checklist_card_idx").on(t.cardId, t.position),
    foreignKey({
      name: "board_checklist_card_fk",
      columns: [t.cardId, t.boardId, t.userId],
      foreignColumns: [boardCards.id, boardCards.boardId, boardCards.userId],
    }).onDelete("cascade"),
    check("board_checklist_title_chk", sql`char_length(${t.title}) between 1 and 200`),
  ],
);

/* ---------- Rate limit (fixed window per user and bucket) ---------- */

export const rateLimits = pgTable(
  "rate_limits",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bucket: text("bucket").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.bucket] })],
);

/* ---------- Capture (ideas) ---------- */

export const ideas = pgTable(
  "ideas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    status: text("status").notNull().default("INBOX"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Target of the composite foreign key from idea_tags.
    uniqueIndex("ideas_id_user_uq").on(t.id, t.userId),
    index("ideas_user_updated_idx").on(t.userId, t.updatedAt, t.id),
    check("ideas_title_chk", sql`char_length(${t.title}) between 1 and 200`),
    check("ideas_body_chk", sql`char_length(${t.body}) <= 20000`),
    check("ideas_status_chk", sql`${t.status} in ('INBOX', 'ACTIVE', 'ARCHIVED')`),
  ],
);

export const ideaTags = pgTable(
  "idea_tags",
  {
    userId: uuid("user_id").notNull(),
    ideaId: uuid("idea_id").notNull(),
    tag: text("tag").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.ideaId, t.tag] }),
    index("idea_tags_user_tag_idx").on(t.userId, t.tag),
    // The tag must belong to an idea of the same user. The database enforces it.
    foreignKey({
      name: "idea_tags_idea_owner_fk",
      columns: [t.ideaId, t.userId],
      foreignColumns: [ideas.id, ideas.userId],
    }).onDelete("cascade"),
    check("idea_tags_tag_chk", sql`${t.tag} ~ '^[a-z0-9][a-z0-9-]{0,31}$'`),
  ],
);

/* ---------- Tadabur ---------- */

export const tadaburEntries = pgTable(
  "tadabur_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    logDate: date("log_date", { mode: "string" }).notNull(),
    surah: integer("surah").notNull(),
    ayatFrom: integer("ayat_from").notNull(),
    ayatTo: integer("ayat_to").notNull(),
    reflection: text("reflection").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("tadabur_user_date_idx")
      .on(t.userId, t.logDate, t.id)
      .where(sql`${t.deletedAt} is null`),
    check("tadabur_surah_chk", sql`${t.surah} between 1 and 114`),
    check(
      "tadabur_ayat_chk",
      sql`${t.ayatFrom} >= 1 and ${t.ayatTo} >= ${t.ayatFrom} and ${t.ayatTo} <= 286`,
    ),
    check("tadabur_reflection_chk", sql`char_length(${t.reflection}) between 1 and 10000`),
  ],
);

/* ---------- Career ---------- */

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    company: text("company").notNull(),
    role: text("role").notNull(),
    source: text("source"),
    link: text("link"),
    status: text("status").notNull().default("APPLIED"),
    appliedAt: date("applied_at", { mode: "string" }),
    nextAction: text("next_action"),
    nextActionDate: date("next_action_date", { mode: "string" }),
    salaryInfo: text("salary_info"),
    notes: text("notes"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Target of the composite foreign key from job_events.
    uniqueIndex("jobs_id_user_uq").on(t.id, t.userId),
    index("jobs_user_active_idx")
      .on(t.userId, t.updatedAt, t.id)
      .where(sql`${t.archivedAt} is null`),
    index("jobs_user_next_idx")
      .on(t.userId, t.nextActionDate)
      .where(sql`${t.archivedAt} is null and ${t.nextActionDate} is not null`),
    check("jobs_company_chk", sql`char_length(${t.company}) between 1 and 120`),
    check("jobs_role_chk", sql`char_length(${t.role}) between 1 and 120`),
    check(
      "jobs_status_chk",
      sql`${t.status} in ('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED', 'WITHDRAWN')`,
    ),
    check("jobs_link_chk", sql`${t.link} is null or char_length(${t.link}) <= 2000`),
    check("jobs_notes_chk", sql`${t.notes} is null or char_length(${t.notes}) <= 10000`),
  ],
);

export const jobEvents = pgTable(
  "job_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: uuid("job_id").notNull(),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("job_events_job_time_idx").on(t.jobId, t.occurredAt),
    // The event must belong to a job of the same user. The database enforces it.
    foreignKey({
      name: "job_events_job_owner_fk",
      columns: [t.jobId, t.userId],
      foreignColumns: [jobs.id, jobs.userId],
    }).onDelete("cascade"),
    check(
      "job_events_to_chk",
      sql`${t.toStatus} in ('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED', 'WITHDRAWN')`,
    ),
    check(
      "job_events_from_chk",
      sql`${t.fromStatus} is null or ${t.fromStatus} in ('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED', 'WITHDRAWN')`,
    ),
  ],
);

export const careerActivities = pgTable(
  "career_activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activityDate: date("activity_date", { mode: "string" }).notNull(),
    kind: text("kind").notNull(),
    count: integer("count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One row per user, day, and kind. Upserts depend on this index.
    uniqueIndex("career_activities_day_kind_uq").on(t.userId, t.activityDate, t.kind),
    check(
      "career_activities_kind_chk",
      sql`${t.kind} in ('APPLY', 'FOLLOW_UP', 'NETWORKING', 'REMOTE_COMMUNITY', 'OTHER')`,
    ),
    check("career_activities_count_chk", sql`${t.count} between 0 and 1000`),
  ],
);

/* ---------- Learning ---------- */

export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: text("kind").notNull().default("STUDY"),
    status: text("status").notNull().default("QUEUED"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("subjects_id_user_uq").on(t.id, t.userId),
    uniqueIndex("subjects_user_name_uq").on(t.userId, t.name),
    index("subjects_user_status_idx").on(t.userId, t.status),
    check("subjects_name_chk", sql`char_length(${t.name}) between 1 and 80`),
    check("subjects_kind_chk", sql`${t.kind} in ('STUDY', 'LANGUAGE', 'FAITH')`),
    check("subjects_status_chk", sql`${t.status} in ('QUEUED', 'ACTIVE', 'ARCHIVED')`),
  ],
);

export const learningItems = pgTable(
  "learning_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id").notNull(),
    title: text("title").notNull(),
    kind: text("kind").notNull().default("BOOK"),
    sourceUrl: text("source_url"),
    totalUnits: integer("total_units"),
    status: text("status").notNull().default("QUEUED"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Target of the composite foreign keys from reading_progress and review_cards.
    uniqueIndex("learning_items_id_user_uq").on(t.id, t.userId),
    index("learning_items_user_subject_idx").on(t.userId, t.subjectId, t.status),
    foreignKey({
      name: "learning_items_subject_owner_fk",
      columns: [t.subjectId, t.userId],
      foreignColumns: [subjects.id, subjects.userId],
    }).onDelete("cascade"),
    check("learning_items_title_chk", sql`char_length(${t.title}) between 1 and 160`),
    check("learning_items_kind_chk", sql`${t.kind} in ('BOOK', 'COURSE', 'RESEARCH')`),
    check(
      "learning_items_status_chk",
      sql`${t.status} in ('QUEUED', 'ACTIVE', 'DONE', 'ARCHIVED')`,
    ),
    check(
      "learning_items_units_chk",
      sql`${t.totalUnits} is null or ${t.totalUnits} between 1 and 100000`,
    ),
    check(
      "learning_items_url_chk",
      sql`${t.sourceUrl} is null or (char_length(${t.sourceUrl}) <= 2000 and ${t.sourceUrl} like 'https://%')`,
    ),
  ],
);

export const readingProgress = pgTable(
  "reading_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemId: uuid("item_id").notNull(),
    logDate: date("log_date", { mode: "string" }).notNull(),
    units: integer("units").notNull().default(0),
    minutes: integer("minutes").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One row per item and day. The upsert in the repository depends on this index.
    uniqueIndex("reading_progress_item_day_uq").on(t.itemId, t.logDate),
    index("reading_progress_user_day_idx").on(t.userId, t.logDate),
    foreignKey({
      name: "reading_progress_item_owner_fk",
      columns: [t.itemId, t.userId],
      foreignColumns: [learningItems.id, learningItems.userId],
    }).onDelete("cascade"),
    check("reading_progress_units_chk", sql`${t.units} between 0 and 100000`),
    check("reading_progress_minutes_chk", sql`${t.minutes} between 0 and 1440`),
  ],
);

export const reviewCards = pgTable(
  "review_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Nullable: a card may stand alone. When it belongs to an item, both columns are checked together.
    itemId: uuid("item_id"),
    prompt: text("prompt").notNull(),
    ef: doublePrecision("ef").notNull().default(2.5),
    intervalDays: integer("interval_days").notNull().default(0),
    repetitions: integer("repetitions").notNull().default(0),
    dueOn: date("due_on", { mode: "string" }).notNull(),
    lastQuality: integer("last_quality"),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (t) => [
    index("review_cards_user_due_idx")
      .on(t.userId, t.dueOn)
      .where(sql`${t.archivedAt} is null`),
    // Cascade, not set null: a composite set null would also clear user_id, which is NOT NULL.
    foreignKey({
      name: "review_cards_item_owner_fk",
      columns: [t.itemId, t.userId],
      foreignColumns: [learningItems.id, learningItems.userId],
    }).onDelete("cascade"),
    check("review_cards_prompt_chk", sql`char_length(${t.prompt}) between 1 and 500`),
    check("review_cards_ef_chk", sql`${t.ef} >= 1.3`),
    check("review_cards_counters_chk", sql`${t.intervalDays} >= 0 and ${t.repetitions} >= 0`),
    check(
      "review_cards_quality_chk",
      sql`${t.lastQuality} is null or ${t.lastQuality} between 0 and 5`,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
