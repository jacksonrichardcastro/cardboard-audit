"use server";

import { eq, desc, ilike, and, gte, lte } from "drizzle-orm";
import { db, withUserContext } from "@/lib/db";
import { listings, sellers } from "@/lib/db/schema";
import { unstable_cache, revalidateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";

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
        return await withUserContext(null, async (tx) => {
          return await tx.select({
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
        });
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
    const data = await withUserContext(null, async (tx) => {
      const [record] = await tx.select({
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
      return record;
    });

    return data || null;
  } catch (error) {
    console.error(`Error fetching listing:`, error);
    return null;
  }
}

export async function createListing(payload: {
  title: string;
  category: string;
  condition: string;
  priceCents: number;
  description: string;
  photos: string[];
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [sellerRecord] = await withUserContext(userId, async (tx) => {
      return await tx.select({ status: sellers.applicationStatus })
        .from(sellers).where(eq(sellers.userId, userId)).limit(1);
  });

  if (!sellerRecord || sellerRecord.status !== "APPROVED") {
    throw new Error("Must be an approved vendor to list items");
  }

  const [newListing] = await withUserContext(userId, async (tx) => {
    return await tx.insert(listings).values({
      sellerId: userId,
      title: payload.title,
      category: payload.category, // Enum correctly mapped in Zod
      condition: payload.condition,
    priceCents: payload.priceCents,
    description: payload.description,
    photos: payload.photos,
    status: "ACTIVE",
  }).returning({ id: listings.id });

  // P1-2: Caching engine handles ISR naturally on navigation
  return newListing.id;
}
