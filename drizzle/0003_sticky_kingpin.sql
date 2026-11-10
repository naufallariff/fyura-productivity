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
CREATE TABLE "habit_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"habit_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"source" text DEFAULT 'MANUAL' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "habit_checks_value_chk" CHECK ("habit_checks"."value" >= 0)
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"kind" text NOT NULL,
	"target" integer DEFAULT 1 NOT NULL,
	"off_day_core" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "habits_kind_chk" CHECK ("habits"."kind" in ('BINARY', 'QUANTITY')),
	CONSTRAINT "habits_category_chk" CHECK ("habits"."category" in ('WORSHIP', 'LEARNING', 'WORK', 'CAREER', 'FITNESS', 'REST', 'SOCIAL', 'LEISURE')),
	CONSTRAINT "habits_target_chk" CHECK ("habits"."target" > 0)
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
	"habit_id" uuid,
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
ALTER TABLE "day_logs" ADD CONSTRAINT "day_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_checks" ADD CONSTRAINT "habit_checks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_checks" ADD CONSTRAINT "habit_checks_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_blocks" ADD CONSTRAINT "time_blocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_blocks" ADD CONSTRAINT "time_blocks_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "habit_checks_habit_day_uq" ON "habit_checks" USING btree ("habit_id","log_date");--> statement-breakpoint
CREATE INDEX "habit_checks_user_day_idx" ON "habit_checks" USING btree ("user_id","log_date");--> statement-breakpoint
CREATE UNIQUE INDEX "habits_user_key_uq" ON "habits" USING btree ("user_id","key");--> statement-breakpoint
CREATE INDEX "time_blocks_user_day_idx" ON "time_blocks" USING btree ("user_id","log_date");