import { db } from "../src/lib/db";
import { listings, profiles } from "../src/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

async function main() {
  const trending = await db.select({
    id: listings.id,
    title: listings.title,
    cardId: listings.cardId,
    photos: sql<string[]>`COALESCE((SELECT json_agg(storage_path ORDER BY sort_order ASC) FROM item_photos WHERE card_id = ${listings.cardId}), '[]'::json)`,
  })
  .from(listings)
  .innerJoin(profiles, eq(listings.sellerId, profiles.userId))
  .where(eq(listings.status, "ACTIVE"))
  .orderBy(desc(listings.createdAt))
  .limit(10);
  
  for (const l of trending) {
    console.log(`Listing ${l.id} - ${l.title}:`);
    console.log(`  photos:`, l.photos);
  }
}

main().catch(console.error);
