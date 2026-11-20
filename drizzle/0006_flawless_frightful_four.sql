CREATE TABLE "learning_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"title" text NOT NULL,
	"kind" text DEFAULT 'BOOK' NOT NULL,
	"source_url" text,
	"total_units" integer,
	"status" text DEFAULT 'QUEUED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_items_title_chk" CHECK (char_length("learning_items"."title") between 1 and 160),
	CONSTRAINT "learning_items_kind_chk" CHECK ("learning_items"."kind" in ('BOOK', 'COURSE', 'RESEARCH')),
	CONSTRAINT "learning_items_status_chk" CHECK ("learning_items"."status" in ('QUEUED', 'ACTIVE', 'DONE', 'ARCHIVED')),
	CONSTRAINT "learning_items_units_chk" CHECK ("learning_items"."total_units" is null or "learning_items"."total_units" between 1 and 100000),
	CONSTRAINT "learning_items_url_chk" CHECK ("learning_items"."source_url" is null or (char_length("learning_items"."source_url") <= 2000 and "learning_items"."source_url" like 'https://%'))
);
--> statement-breakpoint
CREATE TABLE "reading_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"units" integer DEFAULT 0 NOT NULL,
	"minutes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reading_progress_units_chk" CHECK ("reading_progress"."units" between 0 and 100000),
	CONSTRAINT "reading_progress_minutes_chk" CHECK ("reading_progress"."minutes" between 0 and 1440)
);
--> statement-breakpoint
CREATE TABLE "review_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_id" uuid,
	"prompt" text NOT NULL,
	"ef" double precision DEFAULT 2.5 NOT NULL,
	"interval_days" integer DEFAULT 0 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"due_on" date NOT NULL,
	"last_quality" integer,
	"last_reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "review_cards_prompt_chk" CHECK (char_length("review_cards"."prompt") between 1 and 500),
	CONSTRAINT "review_cards_ef_chk" CHECK ("review_cards"."ef" >= 1.3),
	CONSTRAINT "review_cards_counters_chk" CHECK ("review_cards"."interval_days" >= 0 and "review_cards"."repetitions" >= 0),
	CONSTRAINT "review_cards_quality_chk" CHECK ("review_cards"."last_quality" is null or "review_cards"."last_quality" between 0 and 5)
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'STUDY' NOT NULL,
	"status" text DEFAULT 'QUEUED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subjects_name_chk" CHECK (char_length("subjects"."name") between 1 and 80),
	CONSTRAINT "subjects_kind_chk" CHECK ("subjects"."kind" in ('STUDY', 'LANGUAGE', 'FAITH')),
	CONSTRAINT "subjects_status_chk" CHECK ("subjects"."status" in ('QUEUED', 'ACTIVE', 'ARCHIVED'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "learning_items_id_user_uq" ON "learning_items" USING btree ("id","user_id");
--> statement-breakpoint
CREATE INDEX "learning_items_user_subject_idx" ON "learning_items" USING btree ("user_id","subject_id","status");
--> statement-breakpoint
CREATE UNIQUE INDEX "reading_progress_item_day_uq" ON "reading_progress" USING btree ("item_id","log_date");
--> statement-breakpoint
CREATE INDEX "reading_progress_user_day_idx" ON "reading_progress" USING btree ("user_id","log_date");
--> statement-breakpoint
CREATE INDEX "review_cards_user_due_idx" ON "review_cards" USING btree ("user_id","due_on") WHERE "review_cards"."archived_at" is null;
--> statement-breakpoint
CREATE UNIQUE INDEX "subjects_id_user_uq" ON "subjects" USING btree ("id","user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "subjects_user_name_uq" ON "subjects" USING btree ("user_id","name");
--> statement-breakpoint
CREATE INDEX "subjects_user_status_idx" ON "subjects" USING btree ("user_id","status");
--> statement-breakpoint
ALTER TABLE "learning_items" ADD CONSTRAINT "learning_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "learning_items" ADD CONSTRAINT "learning_items_subject_owner_fk" FOREIGN KEY ("subject_id","user_id") REFERENCES "public"."subjects"("id","user_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_item_owner_fk" FOREIGN KEY ("item_id","user_id") REFERENCES "public"."learning_items"("id","user_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "review_cards" ADD CONSTRAINT "review_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "review_cards" ADD CONSTRAINT "review_cards_item_owner_fk" FOREIGN KEY ("item_id","user_id") REFERENCES "public"."learning_items"("id","user_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
