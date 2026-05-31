CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" integer NOT NULL,
	"buyer_id" varchar(255) NOT NULL,
	"seller_id" varchar(255) NOT NULL,
	"current_amount_cents" integer NOT NULL,
	"current_message" text,
	"state" varchar(50) DEFAULT 'pending' NOT NULL,
	"rounds_used" integer DEFAULT 1 NOT NULL,
	"last_actor_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp DEFAULT now() + interval '7 days' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_last_actor_id_users_id_fk" FOREIGN KEY ("last_actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_offers_listing_id" ON "offers" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_offers_buyer_id" ON "offers" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "idx_offers_seller_id" ON "offers" USING btree ("seller_id");