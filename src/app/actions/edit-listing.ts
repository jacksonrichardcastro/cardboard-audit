"use server";

import { db } from "@/lib/db";
import { listings, cards, itemPhotos } from "@/lib/db/schema";
import { eq, and, notInArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

export async function updateListing(listingId: number, data: any) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Verify ownership
  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, listingId),
    with: {
      card: {
        with: {
          photos: true
        }
      }
    }
  });

  if (!listing || listing.sellerId !== userId) {
    throw new Error("Listing not found or unauthorized");
  }

  const cardId = listing.cardId;

  let canonicalTitle = `${data.year || ''} ${data.set || ''} ${data.subject || ''}`.trim();
  if (data.cardNumber) canonicalTitle += ` #${data.cardNumber}`;
  if (data.edition) canonicalTitle += ` ${data.edition}`;
  if (!canonicalTitle.trim()) canonicalTitle = "Unknown Card";

  // Update card fields
  await db.update(cards)
    .set({
      title: canonicalTitle,
      set: data.set,
      year: data.year || null,
      cardNumber: data.cardNumber || null,
      gradingCompany: data.gradingCompany || null,
      grade: data.grade || null,
      condition: data.condition || null,
      description: data.description || null,
      updatedAt: new Date(),
    })
    .where(eq(cards.id, cardId));

  // Update listing fields
  await db.update(listings)
    .set({
      title: canonicalTitle,
      priceCents: Math.round(parseFloat(data.price) * 100),
      shippingMethod: data.shippingMethod || "Standard (USPS Ground Advantage)",
      updatedAt: new Date(),
      category: data.category || "Trading Cards",
      condition: data.condition || "Ungraded",
      description: data.description || null,
      graded: data.graded || false,
      edition: data.edition || null,
      set: data.set || null,
      year: data.year || null,
      cardNumber: data.cardNumber || null,
      gradingCompany: data.gradingCompany || null,
      grade: data.grade || null,
      storefrontId: data.storefrontId || null,
    })
    .where(eq(listings.id, listingId));

  // Handle Photos
  const newPhotoUrls = data.photos.map((p: any) => p.url);
  const existingPhotos = listing.card.photos || [];
  
  const photosToDelete = existingPhotos.filter(ep => !newPhotoUrls.includes(ep.storagePath));
  
  // Clean up Supabase storage
  if (photosToDelete.length > 0) {
    const storagePaths = photosToDelete.map(p => {
      const parts = p.storagePath.split('/cardbound-media/');
      return parts.length > 1 ? parts[1] : null;
    }).filter(Boolean) as string[];

    if (storagePaths.length > 0) {
      const { error } = await supabase.storage.from("cardbound-media").remove(storagePaths);
      if (error) {
        console.error("Failed to delete orphaned photos from storage:", error);
      }
    }

    // Remove from DB
    await db.delete(itemPhotos)
      .where(
        and(
          eq(itemPhotos.cardId, cardId),
          notInArray(itemPhotos.storagePath, newPhotoUrls.length > 0 ? newPhotoUrls : ['invalid_dummy'])
        )
      );
  }

  // Upsert (Insert new or update sort order for kept photos)
  for (let i = 0; i < data.photos.length; i++) {
    const p = data.photos[i];
    const existing = existingPhotos.find(ep => ep.storagePath === p.url);

    if (existing) {
      if (existing.sortOrder !== i || existing.kind !== p.kind) {
        await db.update(itemPhotos)
          .set({ sortOrder: i, kind: p.kind })
          .where(eq(itemPhotos.id, existing.id));
      }
    } else {
      await db.insert(itemPhotos).values({
        cardId,
        kind: p.kind || "front",
        storagePath: p.url,
        sortOrder: i,
      });
    }
  }

  // Handle Category Assignment
  const { categoryMemberships } = await import("@/lib/db/schema");
  if (data.categoryId === "not_exist" || !data.categoryId) {
    // If empty or doesn't exist, remove all category memberships for this card
    await db.delete(categoryMemberships).where(eq(categoryMemberships.cardId, cardId));
  } else {
    // Replace existing memberships with the selected category
    const catId = parseInt(data.categoryId, 10);
    if (!isNaN(catId)) {
      // Clear existing
      await db.delete(categoryMemberships).where(eq(categoryMemberships.cardId, cardId));
      // Insert new
      await db.insert(categoryMemberships).values({
        cardId,
        categoryId: catId,
      });
    }
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath(`/listings/${listingId}/edit`);
  revalidatePath(`/`);
  
  return { success: true };
}

export async function removeListingAction(listingId: number, mode: 'unlist' | 'delete') {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Verify ownership
  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, listingId),
    with: {
      card: true,
    }
  });

  // Server-side auth check
  if (!listing || listing.sellerId !== userId || !listing.card || listing.card.ownerId !== userId) {
    throw new Error("Forbidden: Non-owner attempt");
  }

  const cardId = listing.cardId;

  if (mode === 'unlist') {
    if (listing.status !== 'unlisted') {
      await db.update(listings)
        .set({ status: 'unlisted', updatedAt: new Date() })
        .where(eq(listings.id, listingId));
    }
  } else if (mode === 'delete') {
    // Deleting the card automatically cascades to listings, item_photos, category_memberships
    await db.delete(cards).where(eq(cards.id, cardId));
  } else {
    throw new Error("Invalid mode");
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath(`/listings/${listingId}/edit`);
  revalidatePath(`/`);
  
  return { success: true };
}
