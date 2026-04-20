-- P0-7: Dynamic Delivery Timestamp Column for Escrow Automation Limits
ALTER TABLE "orders" ADD COLUMN "delivered_at" timestamp;
