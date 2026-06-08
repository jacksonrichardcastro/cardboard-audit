import { getMarketplaceTrendingListings } from "./src/lib/db/queries/homeListings";
import { db } from "./src/lib/db";
import { listings, profiles } from "./src/lib/db/schema";
import { eq, desc, and, notInArray, inArray, sql } from "drizzle-orm";
import { TEST_USER_IDS } from './src/lib/db/test-accounts';

async function main() {
  const result = await db
    .select({ id: listings.id })
    .from(listings)
    .innerJoin(profiles, eq(listings.sellerId, profiles.userId))
    .where(and(
      inArray(listings.status, ['active', 'pending_marketplace_activation']),
      sql`${listings.priceCents} IS NOT NULL`,
      notInArray(listings.sellerId, [...TEST_USER_IDS])
    ))
    .orderBy(desc(listings.priceCents))
    .limit(100);

  console.log("Direct query count:", result.length);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

main().catch(err => {
  console.error(err);
  process.exit(1);
});
