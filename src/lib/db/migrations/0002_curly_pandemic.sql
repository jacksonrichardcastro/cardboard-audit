ALTER TABLE "cards" ADD COLUMN "sport" varchar(100);--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "listing_type" varchar(50);--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "grade_tier" varchar(50);--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "era" varchar(50);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "sport" varchar(100);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "listing_type" varchar(50);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "grade_tier" varchar(50);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "era" varchar(50);--> statement-breakpoint
CREATE INDEX "sport_idx" ON "listings" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "listing_type_idx" ON "listings" USING btree ("listing_type");--> statement-breakpoint
CREATE INDEX "grade_tier_idx" ON "listings" USING btree ("grade_tier");--> statement-breakpoint
CREATE INDEX "era_idx" ON "listings" USING btree ("era");--> statement-breakpoint
CREATE INDEX "price_idx" ON "listings" USING btree ("price_cents");