CREATE TABLE "user_preferences" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"sport_categories" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "view_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"listing_id" integer,
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_history" ADD CONSTRAINT "view_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_history" ADD CONSTRAINT "view_history_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "view_history_user_viewed_at_idx" ON "view_history" USING btree ("user_id","viewed_at" DESC);