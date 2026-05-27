CREATE TABLE "audit_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"actor_type" varchar(50) NOT NULL,
	"subject_type" varchar(100),
	"subject_id" varchar(255),
	"payload_json" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"subcategory" varchar(100),
	"set" varchar(100),
	"year" varchar(50),
	"card_number" varchar(100),
	"condition" varchar(100) NOT NULL,
	"grading_company" varchar(100),
	"grade" varchar(50),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"opened_by" varchar(255) NOT NULL,
	"reason" varchar(50) NOT NULL,
	"reason_text" text,
	"buyer_evidence_urls" json DEFAULT '[]'::json,
	"seller_evidence_urls" json DEFAULT '[]'::json,
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"resolution_note" text,
	"resolved_by" varchar(255),
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" integer NOT NULL,
	"kind" varchar(50) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"storage_path" text NOT NULL,
	"width" integer,
	"height" integer,
	"captured_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" varchar(255) NOT NULL,
	"data" json DEFAULT '{}'::json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"reviewer_id" varchar(255) NOT NULL,
	"action" varchar(50) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" varchar(255) NOT NULL,
	"card_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"subcategory" varchar(100),
	"set" varchar(100),
	"year" varchar(50),
	"card_number" varchar(100),
	"condition" varchar(100) NOT NULL,
	"grading_company" varchar(100),
	"grade" varchar(50),
	"description" text,
	"price_cents" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"edition" varchar(100),
	"graded" boolean DEFAULT false NOT NULL,
	"shipping_method" varchar(100),
	"review_notes" text,
	"published_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "title_seller_unique" UNIQUE("title","seller_id")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"buyer_id" varchar(255) NOT NULL,
	"seller_id" varchar(255) NOT NULL,
	"listing_id" integer NOT NULL,
	"current_state" varchar(100) NOT NULL,
	"price_cents_at_sale" integer NOT NULL,
	"tax_cents" integer DEFAULT 0 NOT NULL,
	"shipping_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"fee_cents" integer DEFAULT 0 NOT NULL,
	"stripe_payment_intent_id" varchar(255),
	"transfer_group_id" varchar(255),
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" varchar(255) NOT NULL,
	"order_id" integer NOT NULL,
	"stripe_transfer_id" varchar(255) NOT NULL,
	"gross_cents" integer NOT NULL,
	"fee_cents" integer NOT NULL,
	"net_cents" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"business_name" varchar(255) NOT NULL,
	"handle" varchar(40),
	"display_name" varchar(100),
	"bio" varchar(160),
	"profile_photo_url" text,
	"header_style" varchar(20) DEFAULT 'cards' NOT NULL,
	"banner_image_url" text,
	"location_city" varchar(100),
	"location_state" varchar(50),
	"description" text,
	"identity_verified" boolean DEFAULT false NOT NULL,
	"application_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"fee_tier" varchar(50) DEFAULT 'standard' NOT NULL,
	"stripe_connect_account_id" varchar(255),
	"kyc_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approval_status" varchar(20) DEFAULT 'unsubmitted' NOT NULL,
	"tos_accepted_at" timestamp,
	"photo_guidelines_accepted_at" timestamp,
	"approved_at" timestamp,
	"rejection_reason" text,
	"grail_listing_id" integer,
	"grail_card_id" integer,
	"binder_private" boolean DEFAULT false NOT NULL,
	"header_customization_ids" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_handle_idx" UNIQUE("handle"),
	CONSTRAINT "profiles_stripe_connect_account_id_idx" UNIQUE("stripe_connect_account_id")
);
--> statement-breakpoint
CREATE TABLE "seller_approval_queue" (
	"seller_id" varchar(255) PRIMARY KEY NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewer_notes" text
);
--> statement-breakpoint
CREATE TABLE "state_transitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"previous_state" varchar(100),
	"new_state" varchar(100) NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"tracking_number" varchar(255),
	"carrier" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'buyer' NOT NULL,
	"account_type" varchar(20) DEFAULT 'buyer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"source" varchar(50) NOT NULL,
	"event_type" varchar(255),
	"payload_json" json NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_by_users_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_photos" ADD CONSTRAINT "item_photos_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_drafts" ADD CONSTRAINT "listing_drafts_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_reviews" ADD CONSTRAINT "listing_reviews_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_reviews" ADD CONSTRAINT "listing_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_approval_queue" ADD CONSTRAINT "seller_approval_queue_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "state_transitions" ADD CONSTRAINT "state_transitions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_owner_idx" ON "cards" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_item_photos_card_id" ON "item_photos" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "idx_item_photos_card_id_sort" ON "item_photos" USING btree ("card_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_listing_drafts_seller_id" ON "listing_drafts" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_listing_reviews_listing_id" ON "listing_reviews" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_listing_reviews_reviewer_id" ON "listing_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "seller_idx" ON "listings" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "category_idx" ON "listings" USING btree ("category","subcategory");--> statement-breakpoint
CREATE INDEX "buyer_order_idx" ON "orders" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "seller_order_idx" ON "orders" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "orders_buyer_created_idx" ON "orders" USING btree ("buyer_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX "orders_pending_confirm_delivered_idx" ON "orders" USING btree ("delivered_at");--> statement-breakpoint
CREATE INDEX "tracking_idx" ON "state_transitions" USING btree ("tracking_number");--> statement-breakpoint
CREATE INDEX "state_transitions_tracking_recent_idx" ON "state_transitions" USING btree ("tracking_number","created_at" DESC);