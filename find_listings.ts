import { db } from "./src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const result = await db.execute(sql`
    SELECT id, title, price_cents, seller_id FROM listings 
    WHERE (title ILIKE '%Cooper Flagg%High Fidelity%' AND price_cents = 2000)
       OR (title ILIKE '%Kon Knueppel%Refractor%' AND price_cents = 1999);
  `);
  console.log("Found listings:", result);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
