CREATE TABLE "audit_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"actor_type" varchar(50) NOT NULL,
	"subject_type" varchar(100),
	"subject_id" varchar(255),
	"payload_json" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"opened_by" varchar(255) NOT NULL,
	"reason" varchar(50) NOT NULL,
	"reason_text" text,
	"buyer_evidence_urls" json DEFAULT '[]'::json,
	"seller_evidence_urls" json DEFAULT '[]'::json,
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"resolution_note" text,
	"resolved_by" varchar(255),
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"source" varchar(50) NOT NULL,
	"event_type" varchar(255),
	"payload_json" json NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_by_users_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
