import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from "./src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Running migration...");
  await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "welcome_modal_dismissed" boolean NOT NULL DEFAULT false;`);
  console.log("Migration successful.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
