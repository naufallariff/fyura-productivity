CREATE TABLE "idea_tags" (
	"user_id" uuid NOT NULL,
	"idea_id" uuid NOT NULL,
	"tag" text NOT NULL,
	CONSTRAINT "idea_tags_idea_id_tag_pk" PRIMARY KEY("idea_id","tag"),
	CONSTRAINT "idea_tags_tag_chk" CHECK ("idea_tags"."tag" ~ '^[a-z0-9][a-z0-9-]{0,31}$')
);
--> statement-breakpoint
CREATE TABLE "ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'INBOX' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ideas_title_chk" CHECK (char_length("ideas"."title") between 1 and 200),
	CONSTRAINT "ideas_body_chk" CHECK (char_length("ideas"."body") <= 20000),
	CONSTRAINT "ideas_status_chk" CHECK ("ideas"."status" in ('INBOX', 'ACTIVE', 'ARCHIVED'))
);
--> statement-breakpoint
CREATE TABLE "tadabur_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"surah" integer NOT NULL,
	"ayat_from" integer NOT NULL,
	"ayat_to" integer NOT NULL,
	"reflection" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "tadabur_surah_chk" CHECK ("tadabur_entries"."surah" between 1 and 114),
	CONSTRAINT "tadabur_ayat_chk" CHECK ("tadabur_entries"."ayat_from" >= 1 and "tadabur_entries"."ayat_to" >= "tadabur_entries"."ayat_from" and "tadabur_entries"."ayat_to" <= 286),
	CONSTRAINT "tadabur_reflection_chk" CHECK (char_length("tadabur_entries"."reflection") between 1 and 10000)
);
--> statement-breakpoint
CREATE INDEX "idea_tags_user_tag_idx" ON "idea_tags" USING btree ("user_id","tag");
--> statement-breakpoint
CREATE UNIQUE INDEX "ideas_id_user_uq" ON "ideas" USING btree ("id","user_id");
--> statement-breakpoint
CREATE INDEX "ideas_user_updated_idx" ON "ideas" USING btree ("user_id","updated_at","id");
--> statement-breakpoint
CREATE INDEX "tadabur_user_date_idx" ON "tadabur_entries" USING btree ("user_id","log_date","id") WHERE "tadabur_entries"."deleted_at" is null;
--> statement-breakpoint
ALTER TABLE "idea_tags" ADD CONSTRAINT "idea_tags_idea_owner_fk" FOREIGN KEY ("idea_id","user_id") REFERENCES "public"."ideas"("id","user_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tadabur_entries" ADD CONSTRAINT "tadabur_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
