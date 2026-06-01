import { db } from "./src/lib/db";
import { listings } from "./src/lib/db/schema";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Deduping listings by title...");
  
  // Keep only the listing with the max ID for each title
  await db.execute(sql`
    DELETE FROM listings 
    WHERE id NOT IN (
      SELECT MAX(id) 
      FROM listings 
      GROUP BY title, seller_id
    )
  `);

  console.log("Dedupe complete");
  process.exit(0);
}
run().catch(console.error);
