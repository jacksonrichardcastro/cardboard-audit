CREATE TABLE "storefronts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"handle" varchar(50) NOT NULL,
	"display_name" varchar(100),
	"bio" text,
	"avatar_url" text,
	"theme" varchar(50) DEFAULT 'trax-cosmos' NOT NULL,
	"theme_scope" varchar(50) DEFAULT 'profile-wide',
	"header_customization_ids" json DEFAULT '[]'::json,
	"hidden_badges" json DEFAULT '[]'::json,
	"is_default_for_user" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "storefronts_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "storefront_id" uuid;--> statement-breakpoint
ALTER TABLE "handle_history" ADD COLUMN "storefront_id" uuid;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "storefront_id" uuid;--> statement-breakpoint
ALTER TABLE "storefronts" ADD CONSTRAINT "storefronts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_storefronts_user_id" ON "storefronts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_storefronts_handle" ON "storefronts" USING btree (LOWER("handle"));--> statement-breakpoint
CREATE UNIQUE INDEX "idx_storefronts_user_default" ON "storefronts" USING btree ("user_id") WHERE is_default_for_user = true;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_storefront_id_storefronts_id_fk" FOREIGN KEY ("storefront_id") REFERENCES "public"."storefronts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handle_history" ADD CONSTRAINT "handle_history_storefront_id_storefronts_id_fk" FOREIGN KEY ("storefront_id") REFERENCES "public"."storefronts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_storefront_id_storefronts_id_fk" FOREIGN KEY ("storefront_id") REFERENCES "public"."storefronts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_categories_storefront_id" ON "categories" USING btree ("storefront_id");--> statement-breakpoint
CREATE INDEX "idx_listings_storefront_id" ON "listings" USING btree ("storefront_id");--> statement-breakpoint

-- Backfill storefronts for existing users
INSERT INTO storefronts (
  user_id,
  handle,
  display_name,
  bio,
  avatar_url,
  theme,
  theme_scope,
  header_customization_ids,
  hidden_badges,
  is_default_for_user
)
SELECT 
  u.id as user_id,
  COALESCE(p.handle, LEFT(u.id, 50)),
  p.display_name,
  p.bio,
  p.profile_photo_url,
  COALESCE(p.storefront_theme, 'trax-cosmos'),
  COALESCE(p.storefront_theme_scope, 'profile-wide'),
  COALESCE(p.header_customization_ids, '[]'::json),
  COALESCE(p.hidden_badges, '[]'::json),
  true
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id;

--> statement-breakpoint
-- Backfill listings
UPDATE listings l
SET storefront_id = s.id
FROM storefronts s
WHERE l.seller_id = s.user_id AND s.is_default_for_user = true;

--> statement-breakpoint
-- Backfill categories
UPDATE categories c
SET storefront_id = s.id
FROM storefronts s
WHERE c.user_id = s.user_id AND s.is_default_for_user = true;

--> statement-breakpoint
-- Backfill handle_history
UPDATE handle_history h
SET storefront_id = s.id
FROM storefronts s
WHERE h.user_id = s.user_id AND s.is_default_for_user = true;