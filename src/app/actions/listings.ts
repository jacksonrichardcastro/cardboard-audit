"use server";

import { eq, desc, ilike, and, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings, sellers } from "@/lib/db/schema";
import { unstable_cache } from "next/cache";

export async function getTrendingListings(params?: {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
}) {
  try {
    const filters: any[] = [];
    
    if (params?.q) filters.push(ilike(listings.title, `%${params.q}%`));
    if (params?.category) filters.push(eq(listings.category, params.category));
    if (params?.minPrice) filters.push(gte(listings.priceCents, Number(params.minPrice) * 100));
    if (params?.maxPrice) filters.push(lte(listings.priceCents, Number(params.maxPrice) * 100));

    const getCachedData = unstable_cache(
      async () => {
        return await db.select({
          id: listings.id,
          title: listings.title,
          priceCents: listings.priceCents,
          grade: listings.grade,
          condition: listings.condition,
          image: listings.photos,
          sellerName: sellers.businessName,
        })
        .from(listings)
        .innerJoin(sellers, eq(listings.sellerId, sellers.userId))
        .where(filters.length > 0 ? and(...filters) : undefined)
        .orderBy(desc(listings.createdAt))
        .limit(24);
      },
      ['trending-listings', JSON.stringify(params || {})],
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
    const [data] = await db.select({
      id: listings.id,
      title: listings.title,
      category: listings.category,
      condition: listings.condition,
      gradingCompany: listings.gradingCompany,
      grade: listings.grade,
      description: listings.description,
      priceCents: listings.priceCents,
      photos: listings.photos,
      sellerId: listings.sellerId,
      sellerName: sellers.businessName,
      sellerVerified: sellers.identityVerified,
    })
    .from(listings)
    .innerJoin(sellers, eq(listings.sellerId, sellers.userId))
    .where(eq(listings.id, id))
    .limit(1);

    return data || null;
  } catch (error) {
    console.error(`Error fetching listing ${id}:`, error);
    return null;
  }
}
