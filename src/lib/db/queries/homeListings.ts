import { db } from "@/lib/db";
import { listings, profiles } from "@/lib/db/schema";
import { eq, desc, and, notInArray, inArray, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const getHomeRows = unstable_cache(
  async () => {
    // We need to fetch specific listings for bofascards, christian6610, dbergzsportzcardz
    const specificListingsQuery = await db.select({
      id: listings.id,
      title: listings.title,
      priceCents: listings.priceCents,
      grade: listings.grade,
      gradingCompany: listings.gradingCompany,
      condition: listings.condition,
      discountType: listings.discountType,
      discountAmount: listings.discountAmount,
      discountActiveUntil: listings.discountActiveUntil,
      photos: sql<string[]>`COALESCE((SELECT json_agg(storage_path ORDER BY sort_order ASC) FROM item_photos WHERE card_id = ${listings.cardId}), '[]'::json)`,
      sellerBusinessName: profiles.businessName,
      sellerHandle: profiles.handle,
      sellerId: listings.sellerId,
      sport: listings.sport,
      listingType: listings.listingType,
      gradeTier: listings.gradeTier,
      era: listings.era,
      category: listings.category,
      createdAt: listings.createdAt,
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

    const specificListings = specificListingsQuery.map(d => ({
      ...d,
      photoUrl: (Array.isArray(d.photos) && d.photos.length > 0 && d.photos[0] !== null) ? d.photos[0] : 'https://placehold.co/400x550',
    }));

    const pickedSpecificListings: typeof specificListings = [];
    
    const pickListing = (priceMatch: number, titleKeyword: string) => {
      const match = specificListings.find(l => 
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

    // 1. Fetch Pool A: top 20 most expensive active listings with photos, EXCLUDING the specific listings
    const poolAQuery = await db.select({
      id: listings.id,
      title: listings.title,
      priceCents: listings.priceCents,
      grade: listings.grade,
      gradingCompany: listings.gradingCompany,
      condition: listings.condition,
      discountType: listings.discountType,
      discountAmount: listings.discountAmount,
      discountActiveUntil: listings.discountActiveUntil,
      photos: sql<string[]>`COALESCE((SELECT json_agg(storage_path ORDER BY sort_order ASC) FROM item_photos WHERE card_id = ${listings.cardId}), '[]'::json)`,
      sellerBusinessName: profiles.businessName,
      sellerHandle: profiles.handle,
      sellerId: listings.sellerId,
      sport: listings.sport,
      listingType: listings.listingType,
      gradeTier: listings.gradeTier,
      era: listings.era,
      category: listings.category,
      createdAt: listings.createdAt,
    })
    .from(listings)
    .innerJoin(profiles, eq(listings.sellerId, profiles.userId))
    .where(
      and(
        inArray(listings.status, ['active', 'pending_marketplace_activation']),
        sql`EXISTS (SELECT 1 FROM item_photos WHERE card_id = ${listings.cardId})`,
        sql`(${profiles.handle} IS NULL OR ${profiles.handle} NOT IN ('alexthegrader', '@alexthegrader'))`,
        specificListingIds.length > 0 ? notInArray(listings.id, specificListingIds) : undefined
      )
    )
    .orderBy(desc(listings.priceCents))
    .limit(20);

    const poolA = poolAQuery.map(d => ({
      ...d,
      photoUrl: (Array.isArray(d.photos) && d.photos.length > 0 && d.photos[0] !== null) ? d.photos[0] : 'https://placehold.co/400x550',
    }));

    const poolAIds = poolA.map(l => l.id);

    // 2. Fetch Pool B randoms: user_3 and beescardsemporium
    const targetUserId = 'user_3eykjbzyrhydtz2vnirnhqqtlyr';
    const excludedFromB = [...poolAIds, ...specificListingIds];

    const poolBRandomQuery = await db.select({
      id: listings.id,
      sellerId: listings.sellerId,
      title: listings.title,
      priceCents: listings.priceCents,
      grade: listings.grade,
      gradingCompany: listings.gradingCompany,
      condition: listings.condition,
      discountType: listings.discountType,
      discountAmount: listings.discountAmount,
      discountActiveUntil: listings.discountActiveUntil,
      photos: sql<string[]>`COALESCE((SELECT json_agg(storage_path ORDER BY sort_order ASC) FROM item_photos WHERE card_id = ${listings.cardId}), '[]'::json)`,
      sellerBusinessName: profiles.businessName,
      sellerHandle: profiles.handle,
      sport: listings.sport,
      listingType: listings.listingType,
      gradeTier: listings.gradeTier,
      era: listings.era,
      category: listings.category,
      createdAt: listings.createdAt,
    })
    .from(listings)
    .innerJoin(profiles, eq(listings.sellerId, profiles.userId))
    .where(
      and(
        inArray(listings.status, ['active', 'pending_marketplace_activation']),
        sql`EXISTS (SELECT 1 FROM item_photos WHERE card_id = ${listings.cardId})`,
        excludedFromB.length > 0 ? notInArray(listings.id, excludedFromB) : undefined,
        sql`(${profiles.handle} IN ('beescardsemporium', '@beescardsemporium') OR ${listings.sellerId} = ${targetUserId})`
      )
    );

    const poolBRandom = poolBRandomQuery.map(d => ({
      ...d,
      photoUrl: (Array.isArray(d.photos) && d.photos.length > 0 && d.photos[0] !== null) ? d.photos[0] : 'https://placehold.co/400x550',
    }));

    const sellerMap = new Map<string, typeof poolBRandom>();
    for (const listing of poolBRandom) {
      if (!sellerMap.has(listing.sellerId)) sellerMap.set(listing.sellerId, []);
      sellerMap.get(listing.sellerId)!.push(listing);
    }

    const poolBSelected: typeof poolBRandom = [...pickedSpecificListings];
    
    // Pick 2 random for each of the 2 random sellers
    for (const [sellerId, listingsArray] of sellerMap.entries()) {
      const shuffled = [...listingsArray].sort(() => Math.random() - 0.5);
      poolBSelected.push(...shuffled.slice(0, 2));
    }

    // Need 10 cards total in Pool B. If < 10, backfill.
    if (poolBSelected.length < 10) {
      const excludeIds = [...poolAIds, ...poolBSelected.map(l => l.id)];
      const backfillQuery = await db.select({
        id: listings.id,
        sellerId: listings.sellerId,
        title: listings.title,
        priceCents: listings.priceCents,
        grade: listings.grade,
        gradingCompany: listings.gradingCompany,
        condition: listings.condition,
        discountType: listings.discountType,
        discountAmount: listings.discountAmount,
        discountActiveUntil: listings.discountActiveUntil,
        photos: sql<string[]>`COALESCE((SELECT json_agg(storage_path ORDER BY sort_order ASC) FROM item_photos WHERE card_id = ${listings.cardId}), '[]'::json)`,
        sellerBusinessName: profiles.businessName,
        sellerHandle: profiles.handle,
        sport: listings.sport,
        listingType: listings.listingType,
        gradeTier: listings.gradeTier,
        era: listings.era,
        category: listings.category,
        createdAt: listings.createdAt,
      })
      .from(listings)
      .innerJoin(profiles, eq(listings.sellerId, profiles.userId))
      .where(
        and(
          inArray(listings.status, ['active', 'pending_marketplace_activation']),
          sql`EXISTS (SELECT 1 FROM item_photos WHERE card_id = ${listings.cardId})`,
          sql`(${profiles.handle} IS NULL OR ${profiles.handle} NOT IN ('alexthegrader', '@alexthegrader'))`,
          excludeIds.length > 0 ? notInArray(listings.id, excludeIds) : undefined
        )
      )
      .orderBy(desc(listings.priceCents))
      .limit(10 - poolBSelected.length);

      const backfill = backfillQuery.map(d => ({
        ...d,
        photoUrl: (Array.isArray(d.photos) && d.photos.length > 0 && d.photos[0] !== null) ? d.photos[0] : 'https://placehold.co/400x550',
      }));
      poolBSelected.push(...backfill);
    }

    // 3. Split and Distribute
    const poolAShuffled = [...poolA].sort(() => Math.random() - 0.5);
    const poolA_Trending = poolAShuffled.slice(0, 10);
    const poolA_Featured = poolAShuffled.slice(10, 20);

    const poolB_Trending: typeof poolBSelected = [];
    const poolB_Featured: typeof poolBSelected = [];

    const poolBSellerMap = new Map<string, typeof poolBSelected>();
    for (const listing of poolBSelected) {
      if (!poolBSellerMap.has(listing.sellerId)) poolBSellerMap.set(listing.sellerId, []);
      poolBSellerMap.get(listing.sellerId)!.push(listing);
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

    const trending = [...poolA_Trending, ...poolB_Trending].sort(() => Math.random() - 0.5);
    const featured = [...poolA_Featured, ...poolB_Featured].sort(() => Math.random() - 0.5);

    console.log("==========================================");
    console.log("=== HOME PAGE DATA FETCHED (CACHED) ===");
    console.log("=== POOL A (Trending) ===");
    poolA_Trending.forEach(c => console.log(`[${c.id}] $${(c.priceCents/100).toFixed(2)} - ${c.title} (@${c.sellerHandle || c.sellerId})`));
    console.log("=== POOL B (Trending) ===");
    poolB_Trending.forEach(c => console.log(`[${c.id}] $${(c.priceCents/100).toFixed(2)} - ${c.title} (@${c.sellerHandle || c.sellerId})`));
    
    console.log("=== POOL A (Featured) ===");
    poolA_Featured.forEach(c => console.log(`[${c.id}] $${(c.priceCents/100).toFixed(2)} - ${c.title} (@${c.sellerHandle || c.sellerId})`));
    console.log("=== POOL B (Featured) ===");
    poolB_Featured.forEach(c => console.log(`[${c.id}] $${(c.priceCents/100).toFixed(2)} - ${c.title} (@${c.sellerHandle || c.sellerId})`));

    console.log("=== SPECIFIC LISTINGS PICKED ===");
    pickedSpecificListings.forEach(c => console.log(`[${c.id}] $${(c.priceCents/100).toFixed(2)} - ${c.title} (@${c.sellerHandle || c.sellerId})`));
    console.log("==========================================");

    // map fields to match the UI component expected props
    const mapListing = (d: any) => ({
      id: d.id.toString(),
      title: d.title,
      category: d.category as any,
      subcategory: d.subcategory || "Other",
      condition: d.condition,
      grade: d.grade || undefined,
      gradingCompany: d.gradingCompany || undefined,
      priceCents: d.priceCents,
      discountType: d.discountType || undefined,
      discountAmount: d.discountAmount || undefined,
      discountActiveUntil: d.discountActiveUntil || undefined,
      photoUrl: d.photoUrl,
      sellerBusinessName: d.sellerBusinessName || `@${d.sellerHandle}`,
      createdAt: new Date(d.createdAt).toISOString(),
      sport: d.sport || "",
      listingType: d.listingType || "BUY_IT_NOW",
      gradeTier: d.gradeTier || "Raw / Ungraded",
      era: d.era || "Modern (2010+)"
    });

    return {
      trending: trending.map(mapListing),
      featured: featured.map(mapListing)
    };
  },
  ['home-rows-data'],
  { revalidate: 300 } // 5 minutes TTL
);
