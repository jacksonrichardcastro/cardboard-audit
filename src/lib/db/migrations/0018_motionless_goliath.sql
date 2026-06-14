CREATE TABLE IF NOT EXISTS "card_parallels" (
	"id" serial PRIMARY KEY NOT NULL,
	"set_id" integer NOT NULL,
	"subset_id" integer,
	"catalog_card_id" integer,
	"name" varchar(255) NOT NULL,
	"print_run" integer,
	"odds_text" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "card_sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"brand" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"year_label" varchar(50) NOT NULL,
	"release_date" date,
	"description" text,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "card_sets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "catalog_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"set_id" integer NOT NULL,
	"subset_id" integer NOT NULL,
	"card_number" varchar(50) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"team" varchar(255),
	"rc_flag" boolean DEFAULT false NOT NULL,
	"slug" varchar(255) NOT NULL,
	"attributes_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_cards_set_id_slug_unique" UNIQUE("set_id","slug"),
	CONSTRAINT "catalog_cards_set_subset_card_num_unique" UNIQUE("set_id","subset_id","card_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pull_odds" (
	"id" serial PRIMARY KEY NOT NULL,
	"set_id" integer NOT NULL,
	"subset_id" integer,
	"parallel_id" integer,
	"pack_type" varchar(50) NOT NULL,
	"odds_text" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "set_subsets" (
	"id" serial PRIMARY KEY NOT NULL,
	"set_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"subset_type" varchar(50) NOT NULL,
	"card_count" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "catalog_card_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "card_parallels" ADD CONSTRAINT "card_parallels_set_id_card_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."card_sets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "card_parallels" ADD CONSTRAINT "card_parallels_subset_id_set_subsets_id_fk" FOREIGN KEY ("subset_id") REFERENCES "public"."set_subsets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "card_parallels" ADD CONSTRAINT "card_parallels_catalog_card_id_catalog_cards_id_fk" FOREIGN KEY ("catalog_card_id") REFERENCES "public"."catalog_cards"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "catalog_cards" ADD CONSTRAINT "catalog_cards_set_id_card_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."card_sets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "catalog_cards" ADD CONSTRAINT "catalog_cards_subset_id_set_subsets_id_fk" FOREIGN KEY ("subset_id") REFERENCES "public"."set_subsets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pull_odds" ADD CONSTRAINT "pull_odds_set_id_card_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."card_sets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pull_odds" ADD CONSTRAINT "pull_odds_subset_id_set_subsets_id_fk" FOREIGN KEY ("subset_id") REFERENCES "public"."set_subsets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pull_odds" ADD CONSTRAINT "pull_odds_parallel_id_card_parallels_id_fk" FOREIGN KEY ("parallel_id") REFERENCES "public"."card_parallels"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "set_subsets" ADD CONSTRAINT "set_subsets_set_id_card_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."card_sets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "listings" ADD CONSTRAINT "listings_catalog_card_id_catalog_cards_id_fk" FOREIGN KEY ("catalog_card_id") REFERENCES "public"."catalog_cards"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
