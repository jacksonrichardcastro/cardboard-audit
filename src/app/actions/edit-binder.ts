"use server";

import { db } from "@/lib/db";
import { cards, itemPhotos, listings, categoryMemberships } from "@/lib/db/schema";
import { eq, and, notInArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

export async function updateBinderCard(cardId: number, data: any) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Verify ownership
  const card = await db.query.cards.findFirst({
    where: eq(cards.id, cardId),
    with: {
      photos: true,
      listings: true, // to check if there is an active listing
    }
  });

  if (!card || card.ownerId !== userId) {
    throw new Error("Card not found or unauthorized");
  }

  // If there's an active listing, prevent flipping to private
  const hasActiveListing = card.listings && card.listings.some(l => 
    l.status === 'active' || l.status === 'pending_marketplace_activation'
  );

  let isPrivate = data.isPrivate;
  if (hasActiveListing) {
    isPrivate = false; // Force public if there is an active listing
  }

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
      isPrivate: isPrivate,
      updatedAt: new Date(),
    })
    .where(eq(cards.id, cardId));

  // Handle Photos
  const newPhotoUrls = data.photos.map((p: any) => p.url);
  const existingPhotos = card.photos || [];
  
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

  // Also update listing title if one exists
  if (hasActiveListing) {
    const activeListings = card.listings.filter((l: any) => l.status !== 'sold' && l.status !== 'cancelled' && l.status !== 'deleted');
    for (const listing of activeListings) {
      await db.update(listings)
        .set({ 
          title: canonicalTitle,
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
        })
        .where(eq(listings.id, listing.id));
    }
  }

  // Handle Category Membership
  if (data.categoryId && data.categoryId !== "not_exist") {
    const catId = parseInt(data.categoryId);
    if (!isNaN(catId)) {
      await db.delete(categoryMemberships).where(eq(categoryMemberships.cardId, cardId));
      await db.insert(categoryMemberships).values({
        cardId,
        categoryId: catId,
        addedAt: new Date()
      });
    }
  } else if (data.categoryId === "") {
    await db.delete(categoryMemberships).where(eq(categoryMemberships.cardId, cardId));
  }

  revalidatePath(`/binder/${cardId}/edit`);
  revalidatePath(`/[handle]`, 'page');
  
  return { success: true };
}

export async function removeCardAction(cardId: number) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const card = await db.query.cards.findFirst({
    where: eq(cards.id, cardId),
  });

  if (!card || card.ownerId !== userId) {
    throw new Error("Forbidden: Non-owner attempt");
  }

  await db.delete(cards).where(eq(cards.id, cardId));
  return { success: true };
}
