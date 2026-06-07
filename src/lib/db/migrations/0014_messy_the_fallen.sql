CREATE TABLE "handle_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"old_handle" varchar(50) NOT NULL,
	"new_handle" varchar(50) NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "handle_history" ADD CONSTRAINT "handle_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_handle_history_old_handle" ON "handle_history" USING btree (LOWER("old_handle"));--> statement-breakpoint
CREATE INDEX "idx_handle_history_user_id" ON "handle_history" USING btree ("user_id");