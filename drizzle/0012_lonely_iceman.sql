CREATE TABLE "weekly_plan_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"weekday" integer NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"is_core" boolean DEFAULT false NOT NULL,
	"planned_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "weekly_plan_weekday_chk" CHECK ("weekly_plan_items"."weekday" between 1 and 7),
	CONSTRAINT "weekly_plan_position_chk" CHECK ("weekly_plan_items"."position" >= 0),
	CONSTRAINT "weekly_plan_title_chk" CHECK (char_length("weekly_plan_items"."title") between 1 and 120),
	CONSTRAINT "weekly_plan_category_chk" CHECK ("weekly_plan_items"."category" in ('WORSHIP', 'LEARNING', 'WORK', 'CAREER', 'FITNESS', 'REST', 'SOCIAL', 'LEISURE')),
	CONSTRAINT "weekly_plan_minutes_chk" CHECK ("weekly_plan_items"."planned_minutes" is null or "weekly_plan_items"."planned_minutes" between 1 and 1440)
);
--> statement-breakpoint
ALTER TABLE "weekly_plan_items" ADD CONSTRAINT "weekly_plan_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "weekly_plan_items_user_day_idx" ON "weekly_plan_items" USING btree ("user_id","weekday","position") WHERE "weekly_plan_items"."deleted_at" is null;