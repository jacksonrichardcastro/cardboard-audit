import { db } from "./src/lib/db";
import { listings, profiles, itemPhotos } from "./src/lib/db/schema";
import { eq, desc, and, notInArray, inArray, sql } from "drizzle-orm";

async function test() {
  const poolAQuery = await db.select({
    id: listings.id,
    title: listings.title,
    priceCents: listings.priceCents,
    sellerHandle: profiles.handle,
    sellerId: listings.sellerId,
  })
  .from(listings)
  .innerJoin(profiles, eq(listings.sellerId, profiles.userId))
  .where(
    and(
      eq(listings.status, 'active'),
      sql`EXISTS (SELECT 1 FROM item_photos WHERE card_id = ${listings.cardId})`
    )
  )
  .orderBy(desc(listings.priceCents))
  .limit(20);

  console.log("Pool A fetched:", poolAQuery.length);

  const poolAIds = poolAQuery.map(l => l.id);

  const targetHandles = ['christian6610', 'bofascards', 'beescardsemporium', 'dbergzsportzcardz', '@christian6610', '@bofascards', '@beescardsemporium', '@dbergzsportzcardz'];
  const targetUserId = 'user_3eykjbzyrhydtz2vnirnhqqtlyr';

  const poolBQuery = await db.select({
    id: listings.id,
    title: listings.title,
    priceCents: listings.priceCents,
    sellerHandle: profiles.handle,
    sellerId: listings.sellerId,
  })
  .from(listings)
  .innerJoin(profiles, eq(listings.sellerId, profiles.userId))
  .where(
    and(
      eq(listings.status, 'active'),
      sql`EXISTS (SELECT 1 FROM item_photos WHERE card_id = ${listings.cardId})`,
      poolAIds.length > 0 ? notInArray(listings.id, poolAIds) : undefined,
      sql`(${profiles.handle} IN ('christian6610', 'bofascards', 'beescardsemporium', 'dbergzsportzcardz', '@christian6610', '@bofascards', '@beescardsemporium', '@dbergzsportzcardz') OR ${listings.sellerId} = ${targetUserId})`
    )
  );

  console.log("Pool B fetched:", poolBQuery.length);

  // Print Pool B grouped
  const sellerMap = new Map();
  for (const l of poolBQuery) {
    if (!sellerMap.has(l.sellerId)) sellerMap.set(l.sellerId, []);
    sellerMap.get(l.sellerId).push(l);
  }
  
  console.log("Founding Sellers found:", sellerMap.size);
  for (const [k, v] of sellerMap.entries()) {
    console.log(k, v.length, "cards");
  }

}

test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
