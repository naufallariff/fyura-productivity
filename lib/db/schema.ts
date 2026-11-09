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
  themeSlug: text("theme_slug").notNull().default("ocean"),
  customThemeId: uuid("custom_theme_id").references(() => themes.id, { onDelete: "set null" }),
  navbarMode: text("navbar_mode").notNull().default("auto"), // 'auto' | 'pinned'
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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
