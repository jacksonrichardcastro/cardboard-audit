ALTER TABLE "view_history" DROP CONSTRAINT "view_history_listing_id_listings_id_fk";
ALTER TABLE "view_history" ADD CONSTRAINT "view_history_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
