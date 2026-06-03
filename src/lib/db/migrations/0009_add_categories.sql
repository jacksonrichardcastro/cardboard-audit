CREATE TABLE IF NOT EXISTS "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_auto_managed" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "category_memberships" (
	"card_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "category_memberships_card_id_category_id_pk" PRIMARY KEY("card_id","category_id")
);

ALTER TABLE "users" ADD COLUMN "storefront_layout" varchar(20) DEFAULT 'grid' NOT NULL;

DO $$ BEGIN
 ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "category_memberships" ADD CONSTRAINT "category_memberships_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "category_memberships" ADD CONSTRAINT "category_memberships_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "categories_user_order_idx" ON "categories" USING btree ("user_id","display_order");
CREATE INDEX IF NOT EXISTS "idx_category_memberships_category_id" ON "category_memberships" USING btree ("category_id");
