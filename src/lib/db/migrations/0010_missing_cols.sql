ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "welcome_modal_dismissed" boolean DEFAULT false NOT NULL;
