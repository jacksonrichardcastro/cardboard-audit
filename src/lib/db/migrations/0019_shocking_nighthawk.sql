CREATE TABLE IF NOT EXISTS "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_user_id" varchar(255) NOT NULL,
	"referred_user_id" varchar(255) NOT NULL,
	"referral_handle_or_code" varchar(40) NOT NULL,
	"status" varchar(50) DEFAULT 'signed_up' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referrals_referred_user_id_unique" UNIQUE("referred_user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "referrals" ADD CONSTRAINT "prevent_self_referral" CHECK ("referrals"."referrer_user_id" != "referrals"."referred_user_id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_user_id_users_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_users_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "listings" ADD CONSTRAINT "listings_catalog_card_id_catalog_cards_id_fk" FOREIGN KEY ("catalog_card_id") REFERENCES "public"."catalog_cards"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
