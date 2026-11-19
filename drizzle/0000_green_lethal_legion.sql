CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"meta" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_card_labels" (
	"user_id" uuid NOT NULL,
	"board_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "board_card_labels_card_id_label_id_pk" PRIMARY KEY("card_id","label_id")
);
--> statement-breakpoint
CREATE TABLE "board_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"board_id" uuid NOT NULL,
	"list_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"position" double precision NOT NULL,
	"due_on" date,
	"due_complete" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "board_cards_title_chk" CHECK (char_length("board_cards"."title") between 1 and 200),
	CONSTRAINT "board_cards_description_chk" CHECK ("board_cards"."description" is null or char_length("board_cards"."description") <= 10000)
);
--> statement-breakpoint
CREATE TABLE "board_checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"board_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"title" text NOT NULL,
	"is_done" boolean DEFAULT false NOT NULL,
	"position" double precision NOT NULL,
	"done_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "board_checklist_title_chk" CHECK (char_length("board_checklist_items"."title") between 1 and 200)
);
--> statement-breakpoint
CREATE TABLE "board_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"board_id" uuid NOT NULL,
	"name" text NOT NULL,
	"hue" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "board_labels_name_chk" CHECK (char_length("board_labels"."name") between 1 and 40),
	CONSTRAINT "board_labels_hue_chk" CHECK ("board_labels"."hue" in ('sky', 'violet', 'amber', 'rose', 'emerald', 'teal', 'orange', 'indigo'))
);
--> statement-breakpoint
CREATE TABLE "board_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"board_id" uuid NOT NULL,
	"title" text NOT NULL,
	"position" double precision NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "board_lists_title_chk" CHECK (char_length("board_lists"."title") between 1 and 80)
);
--> statement-breakpoint
CREATE TABLE "boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"hue" text DEFAULT 'indigo' NOT NULL,
	"starred" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "boards_title_chk" CHECK (char_length("boards"."title") between 1 and 80),
	CONSTRAINT "boards_hue_chk" CHECK ("boards"."hue" in ('sky', 'violet', 'amber', 'rose', 'emerald', 'teal', 'orange', 'indigo'))
);
--> statement-breakpoint
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
CREATE TABLE "day_logs" (
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"status" text DEFAULT 'NORMAL' NOT NULL,
	"note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "day_logs_user_id_log_date_pk" PRIMARY KEY("user_id","log_date"),
	CONSTRAINT "day_logs_status_chk" CHECK ("day_logs"."status" in ('NORMAL', 'SICK', 'FLEXIBLE', 'OFF'))
);
--> statement-breakpoint
CREATE TABLE "focus_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"planned_minutes" integer NOT NULL,
	"actual_minutes" integer NOT NULL,
	"kind" text NOT NULL,
	"completed" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "focus_sessions_kind_chk" CHECK ("focus_sessions"."kind" in ('DEEP', 'LIGHT')),
	CONSTRAINT "focus_sessions_minutes_chk" CHECK ("focus_sessions"."planned_minutes" between 1 and 240 and "focus_sessions"."actual_minutes" >= 0 and "focus_sessions"."actual_minutes" <= "focus_sessions"."planned_minutes")
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"kind" text NOT NULL,
	"title" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "journal_kind_chk" CHECK ("journal_entries"."kind" in ('DAILY', 'LEARNING', 'ENGLISH', 'COURSE', 'FREE')),
	CONSTRAINT "journal_body_chk" CHECK (char_length("journal_entries"."body") between 1 and 20000)
);
--> statement-breakpoint
CREATE TABLE "private_pin" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"pin_hash" text NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"user_id" uuid NOT NULL,
	"bucket" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limits_user_id_bucket_pk" PRIMARY KEY("user_id","bucket")
);
--> statement-breakpoint
CREATE TABLE "time_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	"category" text NOT NULL,
	"activity" text NOT NULL,
	"split_group_id" uuid,
	"source" text DEFAULT 'MANUAL' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "time_blocks_range_chk" CHECK ("time_blocks"."start_minute" >= 0 and "time_blocks"."end_minute" <= 1440 and "time_blocks"."end_minute" > "time_blocks"."start_minute"),
	CONSTRAINT "time_blocks_category_chk" CHECK ("time_blocks"."category" in ('WORSHIP', 'LEARNING', 'WORK', 'CAREER', 'FITNESS', 'REST', 'SOCIAL', 'LEISURE')),
	CONSTRAINT "time_blocks_source_chk" CHECK ("time_blocks"."source" in ('MANUAL', 'TIMER', 'CHIP'))
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"theme_bundle" text DEFAULT 'ocean' NOT NULL,
	"theme_mode" text DEFAULT 'light' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"locale" text DEFAULT 'en' NOT NULL,
	"timezone" text DEFAULT 'Asia/Jakarta' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE INDEX "audit_user_at_idx" ON "audit_log" USING btree ("user_id","at");
--> statement-breakpoint
CREATE INDEX "board_card_labels_label_idx" ON "board_card_labels" USING btree ("label_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "board_cards_id_board_user_uq" ON "board_cards" USING btree ("id","board_id","user_id");
--> statement-breakpoint
CREATE INDEX "board_cards_list_pos_idx" ON "board_cards" USING btree ("list_id","position") WHERE "board_cards"."archived_at" is null;
--> statement-breakpoint
CREATE INDEX "board_cards_board_due_idx" ON "board_cards" USING btree ("board_id","due_on") WHERE "board_cards"."archived_at" is null;
--> statement-breakpoint
CREATE INDEX "board_checklist_card_idx" ON "board_checklist_items" USING btree ("card_id","position");
--> statement-breakpoint
CREATE UNIQUE INDEX "board_labels_id_board_user_uq" ON "board_labels" USING btree ("id","board_id","user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "board_labels_board_name_uq" ON "board_labels" USING btree ("board_id","name");
--> statement-breakpoint
CREATE UNIQUE INDEX "board_lists_id_board_user_uq" ON "board_lists" USING btree ("id","board_id","user_id");
--> statement-breakpoint
CREATE INDEX "board_lists_board_pos_idx" ON "board_lists" USING btree ("board_id","position") WHERE "board_lists"."archived_at" is null;
--> statement-breakpoint
CREATE UNIQUE INDEX "boards_id_user_uq" ON "boards" USING btree ("id","user_id");
--> statement-breakpoint
CREATE INDEX "boards_user_active_idx" ON "boards" USING btree ("user_id","updated_at") WHERE "boards"."archived_at" is null;
--> statement-breakpoint
CREATE UNIQUE INDEX "checklist_entries_day_source_uq" ON "checklist_entries" USING btree ("user_id","log_date","source_item_id");
--> statement-breakpoint
CREATE INDEX "checklist_entries_user_day_idx" ON "checklist_entries" USING btree ("user_id","log_date","position");
--> statement-breakpoint
CREATE INDEX "focus_sessions_user_day_idx" ON "focus_sessions" USING btree ("user_id","log_date");
--> statement-breakpoint
CREATE INDEX "journal_user_day_kind_idx" ON "journal_entries" USING btree ("user_id","log_date","kind");
--> statement-breakpoint
CREATE INDEX "time_blocks_user_day_idx" ON "time_blocks" USING btree ("user_id","log_date");
--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");
--> statement-breakpoint
CREATE INDEX "weekly_plan_items_user_day_idx" ON "weekly_plan_items" USING btree ("user_id","weekday","position") WHERE "weekly_plan_items"."deleted_at" is null;
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "board_card_labels" ADD CONSTRAINT "board_card_labels_card_fk" FOREIGN KEY ("card_id","board_id","user_id") REFERENCES "public"."board_cards"("id","board_id","user_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "board_card_labels" ADD CONSTRAINT "board_card_labels_label_fk" FOREIGN KEY ("label_id","board_id","user_id") REFERENCES "public"."board_labels"("id","board_id","user_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "board_cards" ADD CONSTRAINT "board_cards_board_owner_fk" FOREIGN KEY ("board_id","user_id") REFERENCES "public"."boards"("id","user_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "board_cards" ADD CONSTRAINT "board_cards_list_board_fk" FOREIGN KEY ("list_id","board_id","user_id") REFERENCES "public"."board_lists"("id","board_id","user_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "board_checklist_items" ADD CONSTRAINT "board_checklist_card_fk" FOREIGN KEY ("card_id","board_id","user_id") REFERENCES "public"."board_cards"("id","board_id","user_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "board_labels" ADD CONSTRAINT "board_labels_board_owner_fk" FOREIGN KEY ("board_id","user_id") REFERENCES "public"."boards"("id","user_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "board_lists" ADD CONSTRAINT "board_lists_board_owner_fk" FOREIGN KEY ("board_id","user_id") REFERENCES "public"."boards"("id","user_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "boards" ADD CONSTRAINT "boards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "checklist_entries" ADD CONSTRAINT "checklist_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "checklist_entries" ADD CONSTRAINT "checklist_entries_source_item_id_weekly_plan_items_id_fk" FOREIGN KEY ("source_item_id") REFERENCES "public"."weekly_plan_items"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "day_logs" ADD CONSTRAINT "day_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "private_pin" ADD CONSTRAINT "private_pin_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "time_blocks" ADD CONSTRAINT "time_blocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "weekly_plan_items" ADD CONSTRAINT "weekly_plan_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
