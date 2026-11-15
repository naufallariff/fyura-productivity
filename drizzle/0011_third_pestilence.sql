ALTER TABLE "habit_checks" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "habits" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "themes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "habit_checks" CASCADE;--> statement-breakpoint
DROP TABLE "habits" CASCADE;--> statement-breakpoint
DROP TABLE "themes" CASCADE;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "theme_mode" SET DEFAULT 'light';--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "theme_bundle" text DEFAULT 'ocean' NOT NULL;--> statement-breakpoint
ALTER TABLE "time_blocks" DROP COLUMN "habit_id";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "theme_style";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "theme_palette";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "navbar_mode";