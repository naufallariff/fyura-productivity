CREATE TABLE "checklist_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"source_item_id" uuid,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"is_required" boolean NOT NULL,
	"is_core" boolean NOT NULL,
	"planned_minutes" integer,
	"position" integer NOT NULL,
	"is_done" boolean DEFAULT false NOT NULL,
	"done_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checklist_title_chk" CHECK (char_length("checklist_entries"."title") between 1 and 120),
	CONSTRAINT "checklist_category_chk" CHECK ("checklist_entries"."category" in ('WORSHIP', 'LEARNING', 'WORK', 'CAREER', 'FITNESS', 'REST', 'SOCIAL', 'LEISURE')),
	CONSTRAINT "checklist_position_chk" CHECK ("checklist_entries"."position" >= 0)
);
--> statement-breakpoint
ALTER TABLE "checklist_entries" ADD CONSTRAINT "checklist_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_entries" ADD CONSTRAINT "checklist_entries_source_item_id_weekly_plan_items_id_fk" FOREIGN KEY ("source_item_id") REFERENCES "public"."weekly_plan_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "checklist_entries_day_source_uq" ON "checklist_entries" USING btree ("user_id","log_date","source_item_id");--> statement-breakpoint
CREATE INDEX "checklist_entries_user_day_idx" ON "checklist_entries" USING btree ("user_id","log_date","position");