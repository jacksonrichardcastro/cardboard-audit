ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "welcome_modal_dismissed" boolean DEFAULT false NOT NULL;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "profile_setup_completed" boolean DEFAULT false NOT NULL;
