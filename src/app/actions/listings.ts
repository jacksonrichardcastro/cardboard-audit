"use server";

import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings, sellers } from "@/lib/db/schema";

export async function getTrendingListings() {
  try {
    const data = await db.select({
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
    .orderBy(desc(listings.createdAt))
    .limit(24);

    return data;
  } catch (error) {
    console.error("Error fetching trending listings:", error);
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
