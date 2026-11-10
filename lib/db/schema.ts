import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  boolean,
  check,
  date,
  primaryKey,
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

/* ---------- Themes ---------- */

// Presets are owned by the system (user_id IS NULL). Custom themes belong to a user.
export const themes = pgTable(
  "themes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    seed: jsonb("seed").notNull(), // 8 theme seeds, validated with Zod on read
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Slug is unique per owner
    uniqueIndex("themes_owner_slug_uq").on(t.userId, t.slug),
    // Preset slugs are unique among presets (NULLs are not equal in plain unique indexes)
    uniqueIndex("themes_preset_slug_uq")
      .on(t.slug)
      .where(sql`${t.userId} is null`),
    index("themes_user_idx").on(t.userId),
  ],
);

/* ---------- Per-user settings ---------- */

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  themeStyle: text("theme_style").notNull().default("flat"),
  themePalette: text("theme_palette").notNull().default("navy"),
  themeMode: text("theme_mode").notNull().default("dark"),
  navbarMode: text("navbar_mode").notNull().default("auto"),
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

/* ---------- Habits ---------- */

export const habits = pgTable(
  "habits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(), // stable identifier, e.g. 'prayer_five_daily'
    name: text("name").notNull(),
    category: text("category").notNull(),
    kind: text("kind").notNull(), // 'BINARY' | 'QUANTITY'
    target: integer("target").notNull().default(1),
    offDayCore: boolean("off_day_core").notNull().default(false),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("habits_user_key_uq").on(t.userId, t.key),
    uniqueIndex("habits_id_user_uq").on(t.id, t.userId),
    check("habits_kind_chk", sql`${t.kind} in ('BINARY', 'QUANTITY')`),
    check(
      "habits_category_chk",
      sql`${t.category} in ('WORSHIP', 'LEARNING', 'WORK', 'CAREER', 'FITNESS', 'REST', 'SOCIAL', 'LEISURE')`,
    ),
    check("habits_target_chk", sql`${t.target} > 0`),
  ],
);

// Actual value per habit per logical day. Unique per habit and day.
export const habitChecks = pgTable(
  "habit_checks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    habitId: uuid("habit_id").notNull(),
    logDate: date("log_date", { mode: "string" }).notNull(),
    value: integer("value").notNull().default(0),
    source: text("source").notNull().default("MANUAL"), // 'MANUAL' | 'BLOCK'
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("habit_checks_habit_day_uq").on(t.habitId, t.logDate),
    index("habit_checks_user_day_idx").on(t.userId, t.logDate),
    check("habit_checks_value_chk", sql`${t.value} >= 0`),
    foreignKey({
      name: "habit_checks_habit_owner_fk",
      columns: [t.habitId, t.userId],
      foreignColumns: [habits.id, habits.userId],
    }).onDelete("cascade"),
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
    habitId: uuid("habit_id").references(() => habits.id, { onDelete: "set null" }),
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
    foreignKey({
      name: "time_blocks_habit_owner_fk",
      columns: [t.habitId, t.userId],
      foreignColumns: [habits.id, habits.userId],
    }),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
