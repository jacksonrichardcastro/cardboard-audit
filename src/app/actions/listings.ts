"use server";

import { eq, desc, ilike, and, gte, lte } from "drizzle-orm";
import { db, withUserContext } from "@/lib/db";
import { listings, profiles } from "@/lib/db/schema";
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
      return await tx.select({ status: profiles.applicationStatus })
        .from(profiles).where(eq(profiles.userId, userId)).limit(1);
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
  }).returning({ id: listings.id });
  });

  // P1-2: Caching engine handles ISR naturally on navigation
  return newListing.id;
}

import { inArray, sql } from "drizzle-orm";
import { categoryMemberships, categories, storefronts } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

export async function bulkMoveListingsAction(listingIds: number[], targetStorefrontId: string, targetCategoryId?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!listingIds || listingIds.length === 0) {
    return { error: "No listings selected" };
  }

  // Verify ownership of target storefront
  const targetStorefront = await db.query.storefronts.findFirst({
    where: and(eq(storefronts.id, targetStorefrontId), eq(storefronts.userId, userId))
  });
  if (!targetStorefront) {
    return { error: "Target storefront not found or unauthorized" };
  }

  // Fetch all listings to verify ownership and get cardIds and source storefronts
  const listingsToMove = await db.query.listings.findMany({
    where: inArray(listings.id, listingIds),
    with: {
      card: {
        with: {
          categoryMemberships: {
            with: {
              category: true
            }
          }
        }
      }
    }
  });

  if (listingsToMove.length !== listingIds.length) {
    return { error: "Some listings were not found" };
  }

  const preStateData = listingsToMove.map(l => ({
    listing_id: l.id,
    old_storefront_id: l.storefrontId,
    card_id: l.cardId,
    category_memberships: l.card?.categoryMemberships.map((cm: any) => cm.categoryId) || []
  }));

  for (const l of listingsToMove) {
    if (l.sellerId !== userId) {
      return { error: "You do not own all selected listings" };
    }
  }

  // PRE-STATE LOG (recoverability)
  console.log(JSON.stringify({
    event: "bulk_move_pre_state",
    listings: preStateData
  }));

  try {
    await db.transaction(async (tx) => {
      // 1. Update storefront_id for all selected listings
      await tx.update(listings)
        .set({ storefrontId: targetStorefrontId })
        .where(inArray(listings.id, listingIds));

      // 2. Remove category memberships for the source storefront's categories
      for (const listing of listingsToMove) {
        if (!listing.cardId || !listing.storefrontId) continue;
        
        // Find categories belonging to the source storefront
        const sourceCategories = await tx.select({ id: categories.id })
          .from(categories)
          .where(eq(categories.storefrontId, listing.storefrontId));
        
        const sourceCategoryIds = sourceCategories.map(c => c.id);
        
        if (sourceCategoryIds.length > 0) {
          await tx.delete(categoryMemberships)
            .where(and(
              eq(categoryMemberships.cardId, listing.cardId),
              inArray(categoryMemberships.categoryId, sourceCategoryIds)
            ));
        }

        // 3. Add to target category if provided
        if (targetCategoryId) {
          const catId = parseInt(targetCategoryId, 10);
          if (!isNaN(catId)) {
            await tx.insert(categoryMemberships)
              .values({
                cardId: listing.cardId,
                categoryId: catId
              })
              .onConflictDoNothing();
          }
        }
      }
    });

    revalidatePath("/");
    revalidatePath("/[handle]", "page");
    return { success: true, count: listingIds.length };
  } catch (err: any) {
    console.error("Bulk move error:", err);
    return { error: err.message || "Failed to bulk move listings" };
  }
}
