"use server";

import { eq, desc, ilike, and, gte, lte } from "drizzle-orm";
import { db, withUserContext } from "@/lib/db";
import { listings, sellers } from "@/lib/db/schema";
import { unstable_cache, revalidateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";



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
  });

  // P1-2: Caching engine handles ISR naturally on navigation
  return newListing.id;
}
