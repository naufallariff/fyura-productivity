ALTER TABLE "user_settings" DROP CONSTRAINT "user_settings_custom_theme_id_themes_id_fk";
--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "theme_style" text DEFAULT 'flat' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "theme_palette" text DEFAULT 'navy' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "theme_mode" text DEFAULT 'dark' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "theme_slug";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "custom_theme_id";