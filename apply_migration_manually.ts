import { db } from "./src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const result = await db.execute(sql`
    SELECT seller_id, status, COUNT(*) FROM listings GROUP BY seller_id, status;
  `);
  console.log("Counts:", result);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
