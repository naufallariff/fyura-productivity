CREATE TABLE "career_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"activity_date" date NOT NULL,
	"kind" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "career_activities_kind_chk" CHECK ("career_activities"."kind" in ('APPLY', 'FOLLOW_UP', 'NETWORKING', 'REMOTE_COMMUNITY', 'OTHER')),
	CONSTRAINT "career_activities_count_chk" CHECK ("career_activities"."count" between 0 and 1000)
);
--> statement-breakpoint
CREATE TABLE "job_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_events_to_chk" CHECK ("job_events"."to_status" in ('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED', 'WITHDRAWN')),
	CONSTRAINT "job_events_from_chk" CHECK ("job_events"."from_status" is null or "job_events"."from_status" in ('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED', 'WITHDRAWN'))
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company" text NOT NULL,
	"role" text NOT NULL,
	"source" text,
	"link" text,
	"status" text DEFAULT 'APPLIED' NOT NULL,
	"applied_at" date,
	"next_action" text,
	"next_action_date" date,
	"salary_info" text,
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_company_chk" CHECK (char_length("jobs"."company") between 1 and 120),
	CONSTRAINT "jobs_role_chk" CHECK (char_length("jobs"."role") between 1 and 120),
	CONSTRAINT "jobs_status_chk" CHECK ("jobs"."status" in ('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED', 'WITHDRAWN')),
	CONSTRAINT "jobs_link_chk" CHECK ("jobs"."link" is null or char_length("jobs"."link") <= 2000),
	CONSTRAINT "jobs_notes_chk" CHECK ("jobs"."notes" is null or char_length("jobs"."notes") <= 10000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "career_activities_day_kind_uq" ON "career_activities" USING btree ("user_id","activity_date","kind");
--> statement-breakpoint
CREATE INDEX "job_events_job_time_idx" ON "job_events" USING btree ("job_id","occurred_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_id_user_uq" ON "jobs" USING btree ("id","user_id");
--> statement-breakpoint
CREATE INDEX "jobs_user_active_idx" ON "jobs" USING btree ("user_id","updated_at","id") WHERE "jobs"."archived_at" is null;
--> statement-breakpoint
CREATE INDEX "jobs_user_next_idx" ON "jobs" USING btree ("user_id","next_action_date") WHERE "jobs"."archived_at" is null and "jobs"."next_action_date" is not null;
--> statement-breakpoint
ALTER TABLE "career_activities" ADD CONSTRAINT "career_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "job_events" ADD CONSTRAINT "job_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "job_events" ADD CONSTRAINT "job_events_job_owner_fk" FOREIGN KEY ("job_id","user_id") REFERENCES "public"."jobs"("id","user_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
