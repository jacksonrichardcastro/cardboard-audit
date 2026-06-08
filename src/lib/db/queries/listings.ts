import { eq, desc, ilike, and, gte, lte, sql, like, between, inArray, not } from "drizzle-orm";
import { withUserContext } from "@/lib/db";
import { listings, profiles, itemPhotos, users, storefronts } from "@/lib/db/schema";
import { unstable_cache } from "next/cache";

export async function getTrendingListings(params?: {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sport?: string;
  listing_type?: string;
  grade?: string;
  era?: string;
  price?: string;
  excludeSellerId?: string;
  includePending?: boolean;
}) {
  try {
    const statusFilter = params?.includePending 
      ? inArray(listings.status, ["active", "pending_marketplace_activation"])
      : eq(listings.status, "active");

    const filters: any[] = [
      statusFilter,
      eq(listings.isDemo, false),
      sql`EXISTS (SELECT 1 FROM item_photos WHERE card_id = ${listings.cardId})`
    ];

    if (params?.excludeSellerId) {
      filters.push(not(eq(listings.sellerId, params.excludeSellerId)));
    }
    if (params?.category) filters.push(eq(listings.category, params.category));
    if (params?.minPrice) filters.push(gte(listings.priceCents, Number(params.minPrice) * 100));
    if (params?.maxPrice) filters.push(lte(listings.priceCents, Number(params.maxPrice) * 100));

    if (params?.sport) {
      if (params.sport === 'tcg' || params.sport === 'non-sport') {
        filters.push(like(listings.sport, `${params.sport}%`));
      } else {
        filters.push(eq(listings.sport, params.sport));
      }
    }
    
    if (params?.listing_type) {
      filters.push(eq(listings.listingType, params.listing_type));
    }

    if (params?.grade) {
      const gradeMap: Record<string, string> = {
        'psa-10': 'PSA 10',
        'psa-9': 'PSA 9',
        'other-graded': 'Other Graded',
        'raw': 'Raw / Ungraded'
      };
      if (gradeMap[params.grade]) {
        filters.push(eq(listings.gradeTier, gradeMap[params.grade]));
      }
    }

    if (params?.era) {
      filters.push(eq(listings.era, params.era));
    }

    if (params?.price) {
      if (params.price === 'under-50') filters.push(lte(listings.priceCents, 5000));
      else if (params.price === '50-200') filters.push(between(listings.priceCents, 5000, 20000));
      else if (params.price === '200-1000') filters.push(between(listings.priceCents, 20000, 100000));
      else if (params.price === '1000-5000') filters.push(between(listings.priceCents, 100000, 500000));
      else if (params.price === '5000-plus') filters.push(gte(listings.priceCents, 500000));
    }

    const getCachedData = unstable_cache(
      async () => {
        return await withUserContext(null, async (tx) => {
          return await tx.select({
            id: listings.id,
            title: listings.title,
            priceCents: listings.priceCents,
            grade: listings.grade,
            gradingCompany: listings.gradingCompany,
            condition: listings.condition,
            category: listings.category,
            discountType: listings.discountType,
            discountAmount: listings.discountAmount,
            discountActiveUntil: listings.discountActiveUntil,
            createdAt: listings.createdAt,
            photos: sql<string[]>`COALESCE((SELECT json_agg(storage_path ORDER BY sort_order ASC) FROM item_photos WHERE card_id = ${listings.cardId}), '[]'::json)`,
            sellerName: storefronts.displayName,
          })
          .from(listings)
          .innerJoin(storefronts, eq(listings.storefrontId, storefronts.id))
          .where(filters.length > 0 ? and(...filters) : undefined)
          .orderBy(desc(listings.createdAt))
          .limit(32);
        });
      },
      ['trending-listings-v3', JSON.stringify(params || {})],
      { revalidate: 60, tags: ['listings'] }
    );

    return await getCachedData();
  } catch (error) {
    console.error("Error fetching listings search:", error);
    return [];
  }
}

export async function getListingById(id: number) {
  try {
    const data = await withUserContext(null, async (tx) => {
      const [record] = await tx.select({
        id: listings.id,
        cardId: listings.cardId,
        title: listings.title,
        set: listings.set,
        year: listings.year,
        cardNumber: listings.cardNumber,
        category: listings.category,
        condition: listings.condition,
        gradingCompany: listings.gradingCompany,
        grade: listings.grade,
        description: listings.description,
        priceCents: listings.priceCents,
        discountType: listings.discountType,
        discountAmount: listings.discountAmount,
        discountActiveUntil: listings.discountActiveUntil,
        photos: sql<string[]>`COALESCE((SELECT json_agg(storage_path ORDER BY sort_order ASC) FROM item_photos WHERE card_id = ${listings.cardId}), '[]'::json)`,
        sellerId: listings.sellerId,
        storefrontId: listings.storefrontId,
        sellerName: storefronts.displayName,
        sellerHandle: storefronts.handle,
        sellerVerified: profiles.identityVerified,
        sellerAvatarUrl: storefronts.avatarUrl,
        shipsFrom: listings.shipsFrom,
        shippingEstimate: listings.shippingEstimate,
        shippingMethod: listings.shippingMethod,
        sellerCreatedAt: users.createdAt,
      })
      .from(listings)
      .innerJoin(storefronts, eq(listings.storefrontId, storefronts.id))
      .innerJoin(profiles, eq(listings.sellerId, profiles.userId))
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(listings.id, id))
      .limit(1);
      return record;
    });

    return data || null;
  } catch (error) {
    console.error(`Error fetching listing:`, error);
    return null;
  }
}
