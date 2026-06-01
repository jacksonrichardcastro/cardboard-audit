import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "./src/lib/db";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Running migration...");
  await db.execute(sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_setup_completed boolean NOT NULL DEFAULT false;`);
  console.log("Migration completed.");
  process.exit(0);
}

run().catch(console.error);
