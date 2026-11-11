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
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "focus_sessions_user_day_idx" ON "focus_sessions" USING btree ("user_id","log_date");