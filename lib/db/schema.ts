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

/* ---------- Identitas ---------- */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(), // selalu disimpan lowercase oleh aplikasi
    name: text("name"),
    locale: text("locale").notNull().default("en"),
    timezone: text("timezone").notNull().default("Asia/Jakarta"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)],
);

/* ---------- Tema ---------- */

// Preset dimiliki oleh sistem (user_id NULL). Tema pribadi dimiliki user.
export const themes = pgTable(
  "themes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    seed: jsonb("seed").notNull(), // 8 seed tema, divalidasi Zod saat dibaca
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Slug unik per pemilik
    uniqueIndex("themes_owner_slug_uq").on(t.userId, t.slug),
    // Preset: slug unik di antara preset (NULL tidak dianggap sama di unique biasa)
    uniqueIndex("themes_preset_slug_uq")
      .on(t.slug)
      .where(sql`${t.userId} is null`),
    index("themes_user_idx").on(t.userId),
  ],
);

/* ---------- Pengaturan per user ---------- */

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  themeSlug: text("theme_slug").notNull().default("ocean"),
  customThemeId: uuid("custom_theme_id").references(() => themes.id, { onDelete: "set null" }),
  navbarMode: text("navbar_mode").notNull().default("auto"), // 'auto' | 'pinned'
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------- Gerbang ruang privat ---------- */

export const privatePin = pgTable("private_pin", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  pinHash: text("pin_hash").notNull(), // Argon2id, bukan enkripsi yang bisa dibalik
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------- Audit ---------- */

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // SET NULL agar riwayat tetap ada walau user dihapus
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(), // contoh: 'theme.update', 'data.delete'
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    meta: jsonb("meta"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_user_at_idx").on(t.userId, t.at)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
