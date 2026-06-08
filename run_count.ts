import { db } from "./src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const result = await db.execute(sql`
    SELECT COUNT(*) FROM listings
    WHERE status IN ('active', 'pending_marketplace_activation')
      AND price_cents IS NOT NULL
      AND seller_id NOT IN (
        'buyer-alex', 'seller-storefront', 'seller-private',
        'user_3EeT9EemTgGz7EjjTvfzE3o8PaQ', 'user_3EeT99h8gLrtmnQZe01evf2Mdp1'
      );
  `);
  console.log("Pool count:", result);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
