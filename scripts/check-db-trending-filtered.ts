import { getTrendingListings } from "../src/lib/db/queries/listings";

async function main() {
  console.log("Fetching trending listings from DB (bypassing Next cache)...");
  // We mock the cache internally if we call the query, but wait!
  // To avoid Next.js cache failing in CLI, we'll run the actual query logic here:
  
  import { db } from "../src/lib/db";
  import { listings, profiles } from "../src/lib/db/schema";
  import { eq, desc, sql, and } from "drizzle-orm";
  
  const trending = await db.select({
    id: listings.id,
    title: listings.title,
    cardId: listings.cardId,
    photos: sql<string[]>`COALESCE((SELECT json_agg(storage_path ORDER BY sort_order ASC) FROM item_photos WHERE card_id = ${listings.cardId}), '[]'::json)`,
  })
  .from(listings)
  .innerJoin(profiles, eq(listings.sellerId, profiles.userId))
  .where(and(eq(listings.status, "ACTIVE"), sql`EXISTS (SELECT 1 FROM item_photos WHERE card_id = ${listings.cardId})`))
  .orderBy(desc(listings.createdAt))
  .limit(6);
  
  console.log("Top 6 Trending Results:");
  console.log(JSON.stringify(trending, null, 2));
}

main().catch(console.error);
