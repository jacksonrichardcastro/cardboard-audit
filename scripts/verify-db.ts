import { db } from "../src/lib/db";
import { listings, profiles } from "../src/lib/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

async function main() {
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
  
  console.log(JSON.stringify(trending, null, 2));
}

main().catch(console.error);
