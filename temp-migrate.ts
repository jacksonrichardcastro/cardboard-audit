import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { db } from "./src/lib/db";

async function main() {
  try {
    await db.execute(sql`ALTER TABLE "storefronts" ADD COLUMN "wood_trim_style" varchar(10) DEFAULT 'c3' NOT NULL;`);
    console.log("Migration applied.");
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
main();
