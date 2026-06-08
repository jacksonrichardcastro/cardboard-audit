import { db } from "./src/lib/db";
import { listings, profiles, itemPhotos } from "./src/lib/db/schema";
import { eq, desc, and, notInArray, inArray, sql } from "drizzle-orm";

async function run() {
  const specificListingsQuery = await db.select({
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
      inArray(listings.status, ['active', 'pending_marketplace_activation']),
      sql`EXISTS (SELECT 1 FROM item_photos WHERE card_id = ${listings.cardId})`,
      sql`
        (${listings.title} ILIKE '%Shohei Ohtani%BST-6%') OR
        (${listings.title} ILIKE '%Barry Sanders%Instant Replay%') OR
        (${listings.title} ILIKE '%Kon Knueppel%') OR
        (${listings.title} ILIKE '%Karl-Anthony Towns%') OR
        (${listings.title} ILIKE '%Lamar Jackson%ACT-1%') OR
        (${listings.title} ILIKE '%Steele Hall%')
      `
    )
  );

  const pickedSpecificListings: typeof specificListingsQuery = [];
  const pickListing = (priceMatch: number, titleKeyword: string) => {
    const match = specificListingsQuery.find(l => 
      l.priceCents === priceMatch && 
      l.title.toLowerCase().includes(titleKeyword.toLowerCase())
    );
    if (match) pickedSpecificListings.push(match);
  };

  pickListing(1099, 'shohei ohtani');
  pickListing(1499, 'barry sanders');
  pickListing(1999, 'kon knueppel');
  pickListing(2299, 'karl-anthony towns');
  pickListing(3499, 'lamar jackson');
  pickListing(5999, 'steele hall');

  const specificListingIds = pickedSpecificListings.map(l => l.id);

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
      inArray(listings.status, ['active', 'pending_marketplace_activation']),
      sql`EXISTS (SELECT 1 FROM item_photos WHERE card_id = ${listings.cardId})`,
      sql`(${profiles.handle} IS NULL OR ${profiles.handle} NOT IN ('alexthegrader', '@alexthegrader', 'storefront_test', '@storefront_test'))`,
      specificListingIds.length > 0 ? notInArray(listings.id, specificListingIds) : undefined
    )
  )
  .orderBy(desc(listings.priceCents))
  .limit(20);

  const poolAIds = poolAQuery.map(l => l.id);

  const targetUserId = 'user_3eykjbzyrhydtz2vnirnhqqtlyr';
  const excludedFromB = [...poolAIds, ...specificListingIds];

  const poolBRandomQuery = await db.select({
    id: listings.id,
    sellerId: listings.sellerId,
    title: listings.title,
    priceCents: listings.priceCents,
    sellerHandle: profiles.handle,
  })
  .from(listings)
  .innerJoin(profiles, eq(listings.sellerId, profiles.userId))
  .where(
    and(
      inArray(listings.status, ['active', 'pending_marketplace_activation']),
      sql`EXISTS (SELECT 1 FROM item_photos WHERE card_id = ${listings.cardId})`,
      sql`(${profiles.handle} IS NULL OR ${profiles.handle} NOT IN ('alexthegrader', '@alexthegrader', 'storefront_test', '@storefront_test'))`,
      excludedFromB.length > 0 ? notInArray(listings.id, excludedFromB) : undefined,
      sql`(${profiles.handle} IN ('beescardsemporium', '@beescardsemporium') OR ${listings.sellerId} = ${targetUserId})`
    )
  );

  const sellerMap = new Map();
  for (const listing of poolBRandomQuery) {
    if (!sellerMap.has(listing.sellerId)) sellerMap.set(listing.sellerId, []);
    sellerMap.get(listing.sellerId).push(listing);
  }

  const poolBSelected = [...pickedSpecificListings];
  
  for (const [sellerId, listingsArray] of sellerMap.entries()) {
    const shuffled = [...listingsArray].sort(() => Math.random() - 0.5);
    poolBSelected.push(...shuffled.slice(0, 2));
  }

  if (poolBSelected.length < 10) {
    const excludeIds = [...poolAIds, ...poolBSelected.map(l => l.id)];
    const backfillQuery = await db.select({
      id: listings.id,
      sellerId: listings.sellerId,
      title: listings.title,
      priceCents: listings.priceCents,
      sellerHandle: profiles.handle,
    })
    .from(listings)
    .innerJoin(profiles, eq(listings.sellerId, profiles.userId))
    .where(
      and(
        inArray(listings.status, ['active', 'pending_marketplace_activation']),
        sql`EXISTS (SELECT 1 FROM item_photos WHERE card_id = ${listings.cardId})`,
        sql`(${profiles.handle} IS NULL OR ${profiles.handle} NOT IN ('alexthegrader', '@alexthegrader', 'storefront_test', '@storefront_test'))`,
        excludeIds.length > 0 ? notInArray(listings.id, excludeIds) : undefined
      )
    )
    .orderBy(desc(listings.priceCents))
    .limit(10 - poolBSelected.length);

    poolBSelected.push(...backfillQuery);
  }

  const poolAShuffled = [...poolAQuery].sort(() => Math.random() - 0.5);
  const poolA_Trending = poolAShuffled.slice(0, 10);
  const poolA_Featured = poolAShuffled.slice(10, 20);

  const poolB_Trending: any[] = [];
  const poolB_Featured: any[] = [];

  const poolBSellerMap = new Map();
  for (const listing of poolBSelected) {
    if (!poolBSellerMap.has(listing.sellerId)) poolBSellerMap.set(listing.sellerId, []);
    poolBSellerMap.get(listing.sellerId).push(listing);
  }

  const flatPoolB = [...poolBSelected];
  for (const [sellerId, listingsArray] of poolBSellerMap.entries()) {
    if (listingsArray.length >= 2) {
      poolB_Trending.push(listingsArray[0]);
      poolB_Featured.push(listingsArray[1]);
      flatPoolB.splice(flatPoolB.indexOf(listingsArray[0]), 1);
      flatPoolB.splice(flatPoolB.indexOf(listingsArray[1]), 1);
    } else if (listingsArray.length === 1) {
      if (poolB_Trending.length <= poolB_Featured.length) {
        poolB_Trending.push(listingsArray[0]);
      } else {
        poolB_Featured.push(listingsArray[0]);
      }
      flatPoolB.splice(flatPoolB.indexOf(listingsArray[0]), 1);
    }
  }

  for (const listing of flatPoolB) {
    if (poolB_Trending.length <= poolB_Featured.length) {
      poolB_Trending.push(listing);
    } else {
      poolB_Featured.push(listing);
    }
  }

  console.log("==========================================");
  console.log("=== HOME PAGE DATA FETCHED (TEST) ===");
  console.log("=== POOL A (Trending) ===");
  poolA_Trending.forEach(c => console.log(`[${c.id}] $${(((c.priceCents as number)||0)/100).toFixed(2)} - ${c.title} (@${c.sellerHandle || c.sellerId})`));
  console.log("=== POOL B (Trending) ===");
  poolB_Trending.forEach(c => console.log(`[${c.id}] $${(((c.priceCents as number)||0)/100).toFixed(2)} - ${c.title} (@${c.sellerHandle || c.sellerId})`));
  
  console.log("=== POOL A (Featured) ===");
  poolA_Featured.forEach(c => console.log(`[${c.id}] $${(((c.priceCents as number)||0)/100).toFixed(2)} - ${c.title} (@${c.sellerHandle || c.sellerId})`));
  console.log("=== POOL B (Featured) ===");
  poolB_Featured.forEach(c => console.log(`[${c.id}] $${(((c.priceCents as number)||0)/100).toFixed(2)} - ${c.title} (@${c.sellerHandle || c.sellerId})`));

  console.log("=== SPECIFIC LISTINGS PICKED ===");
  pickedSpecificListings.forEach(c => console.log(`[${c.id}] $${(((c.priceCents as number)||0)/100).toFixed(2)} - ${c.title} (@${c.sellerHandle || c.sellerId})`));
  console.log("==========================================");

}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
