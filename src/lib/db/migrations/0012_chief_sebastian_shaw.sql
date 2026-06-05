ALTER TABLE "profiles" ALTER COLUMN "storefront_theme" SET DEFAULT 'trax-cosmos';--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "storefront_theme_scope" SET DEFAULT 'profile-wide';--> statement-breakpoint
UPDATE "profiles" SET "storefront_theme" = 'trax-cosmos', "storefront_theme_scope" = 'profile-wide';