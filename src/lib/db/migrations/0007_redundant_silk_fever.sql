ALTER TABLE "listings" ALTER COLUMN "status" SET DEFAULT 'pending_marketplace_activation';--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "is_demo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "discount_type" varchar(20);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "discount_amount" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "discount_active_until" timestamp;