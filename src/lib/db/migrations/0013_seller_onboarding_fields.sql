ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "handle" varchar(40);
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "display_name" varchar(100);
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "bio" varchar(160);
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "profile_photo_url" text;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "location_city" varchar(100);
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "location_state" varchar(50);
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "kyc_status" varchar(20) DEFAULT 'pending' NOT NULL;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "approval_status" varchar(20) DEFAULT 'unsubmitted' NOT NULL;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "tos_accepted_at" timestamp;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "photo_guidelines_accepted_at" timestamp;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "approved_at" timestamp;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "rejection_reason" text;

CREATE UNIQUE INDEX IF NOT EXISTS "sellers_handle_idx" ON "sellers" (lower("handle"));
CREATE UNIQUE INDEX IF NOT EXISTS "sellers_stripe_connect_account_id_idx" ON "sellers" ("stripe_connect_account_id");

CREATE TABLE IF NOT EXISTS "seller_approval_queue" (
  "seller_id" varchar(255) PRIMARY KEY REFERENCES "users"("id"),
  "submitted_at" timestamp NOT NULL DEFAULT now(),
  "reviewed_at" timestamp,
  "reviewer_notes" text
);
