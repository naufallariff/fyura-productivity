CREATE TABLE "private_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title_ciphertext" text NOT NULL,
	"body_ciphertext" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "private_records_user_updated_idx" ON "private_records" USING btree ("user_id","updated_at" DESC NULLS LAST,"id" DESC NULLS LAST) WHERE "private_records"."deleted_at" is null;
--> statement-breakpoint
ALTER TABLE "journal_entries" ADD COLUMN "body_is_html" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "tadabur_entries" ADD COLUMN "reflection_is_html" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "private_records" ADD CONSTRAINT "private_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "private_records" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "private_records" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "private_records_owner" ON "private_records" FOR ALL
  USING ("user_id" = app_current_user_id())
  WITH CHECK ("user_id" = app_current_user_id());
--> statement-breakpoint
REVOKE ALL ON TABLE "private_records" FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "private_records" TO app_runtime;
