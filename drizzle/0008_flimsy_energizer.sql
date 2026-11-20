ALTER TABLE "review_cards" DROP CONSTRAINT "review_cards_item_owner_fk";
--> statement-breakpoint
ALTER TABLE "review_cards" ADD CONSTRAINT "review_cards_item_owner_fk" FOREIGN KEY ("item_id","user_id") REFERENCES "public"."learning_items"("id","user_id") ON DELETE no action ON UPDATE no action;
