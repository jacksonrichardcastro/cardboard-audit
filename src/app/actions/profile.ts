"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { sellers, listings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function setGrailListing(listingId: number) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Verify the seller actually owns this listing
  const [listing] = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, listingId), eq(listings.sellerId, userId)))
    .limit(1);

  if (!listing) {
    throw new Error("Listing not found or you do not have permission to set it as a grail.");
  }

  // Update the seller's grail
  await db
    .update(sellers)
    .set({ grailListingId: listingId })
    .where(eq(sellers.userId, userId));

  // Try to find the seller's handle to revalidate their profile page
  const [seller] = await db.select({ handle: sellers.handle }).from(sellers).where(eq(sellers.userId, userId)).limit(1);
  if (seller?.handle) {
    revalidatePath(`/${seller.handle}`);
  }

  return { success: true };
}

export async function updateSellerProfile(data: { bio?: string; locationCity?: string; profilePhotoUrl?: string }) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  await db
    .update(sellers)
    .set({
      bio: data.bio,
      locationCity: data.locationCity,
      profilePhotoUrl: data.profilePhotoUrl,
    })
    .where(eq(sellers.userId, userId));

  const [seller] = await db.select({ handle: sellers.handle }).from(sellers).where(eq(sellers.userId, userId)).limit(1);
  if (seller?.handle) {
    revalidatePath(`/${seller.handle}`);
  }

  return { success: true };
}
