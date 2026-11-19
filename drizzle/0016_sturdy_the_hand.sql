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
CREATE TABLE "rate_limits" (
	"user_id" uuid NOT NULL,
	"bucket" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limits_user_id_bucket_pk" PRIMARY KEY("user_id","bucket")
);
--> statement-breakpoint
ALTER TABLE "board_card_labels" ADD CONSTRAINT "board_card_labels_card_fk" FOREIGN KEY ("card_id","board_id","user_id") REFERENCES "public"."board_cards"("id","board_id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_card_labels" ADD CONSTRAINT "board_card_labels_label_fk" FOREIGN KEY ("label_id","board_id","user_id") REFERENCES "public"."board_labels"("id","board_id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_cards" ADD CONSTRAINT "board_cards_board_owner_fk" FOREIGN KEY ("board_id","user_id") REFERENCES "public"."boards"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_cards" ADD CONSTRAINT "board_cards_list_board_fk" FOREIGN KEY ("list_id","board_id","user_id") REFERENCES "public"."board_lists"("id","board_id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_checklist_items" ADD CONSTRAINT "board_checklist_card_fk" FOREIGN KEY ("card_id","board_id","user_id") REFERENCES "public"."board_cards"("id","board_id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_labels" ADD CONSTRAINT "board_labels_board_owner_fk" FOREIGN KEY ("board_id","user_id") REFERENCES "public"."boards"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_lists" ADD CONSTRAINT "board_lists_board_owner_fk" FOREIGN KEY ("board_id","user_id") REFERENCES "public"."boards"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boards" ADD CONSTRAINT "boards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "board_card_labels_label_idx" ON "board_card_labels" USING btree ("label_id");--> statement-breakpoint
CREATE UNIQUE INDEX "board_cards_id_board_user_uq" ON "board_cards" USING btree ("id","board_id","user_id");--> statement-breakpoint
CREATE INDEX "board_cards_list_pos_idx" ON "board_cards" USING btree ("list_id","position") WHERE "board_cards"."archived_at" is null;--> statement-breakpoint
CREATE INDEX "board_cards_board_due_idx" ON "board_cards" USING btree ("board_id","due_on") WHERE "board_cards"."archived_at" is null;--> statement-breakpoint
CREATE INDEX "board_checklist_card_idx" ON "board_checklist_items" USING btree ("card_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "board_labels_id_board_user_uq" ON "board_labels" USING btree ("id","board_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "board_labels_board_name_uq" ON "board_labels" USING btree ("board_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "board_lists_id_board_user_uq" ON "board_lists" USING btree ("id","board_id","user_id");--> statement-breakpoint
CREATE INDEX "board_lists_board_pos_idx" ON "board_lists" USING btree ("board_id","position") WHERE "board_lists"."archived_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "boards_id_user_uq" ON "boards" USING btree ("id","user_id");--> statement-breakpoint
CREATE INDEX "boards_user_active_idx" ON "boards" USING btree ("user_id","updated_at") WHERE "boards"."archived_at" is null;