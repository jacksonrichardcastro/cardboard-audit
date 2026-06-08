"use server";

import { db } from "@/lib/db";
import { listingDrafts, profiles, cards, listings, itemPhotos, categoryMemberships } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createDraft(initialData: any = {}) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Ensure seller profile exists and is approved (per Phase 4 gate, but re-checked here)
  const seller = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });

  if (!seller) {
    throw new Error("Seller profile not found");
  }

  const [draft] = await db.insert(listingDrafts).values({
    sellerId: userId,
    data: initialData,
  }).returning();

  revalidatePath("/sell/drafts");
  return draft;
}

export async function updateDraft(draftId: number, data: any) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Verify ownership
  const draft = await db.query.listingDrafts.findFirst({
    where: eq(listingDrafts.id, draftId),
  });

  if (!draft || draft.sellerId !== userId) {
    throw new Error("Draft not found or unauthorized");
  }

  const [updated] = await db.update(listingDrafts)
    .set({
      data,
      updatedAt: new Date(),
    })
    .where(eq(listingDrafts.id, draftId))
    .returning();

  return updated;
}

export async function deleteDraft(draftId: number) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  await db.delete(listingDrafts)
    .where(and(eq(listingDrafts.id, draftId), eq(listingDrafts.sellerId, userId)));

  revalidatePath("/sell/drafts");
}

export async function loadDraft(draftId: number) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const draft = await db.query.listingDrafts.findFirst({
    where: eq(listingDrafts.id, draftId),
  });

  if (!draft || draft.sellerId !== userId) {
    throw new Error("Draft not found or unauthorized");
  }

  return draft;
}

export async function publishDraft(draftId: number, isDemo: boolean = false) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // 1. Load Draft & Verify Ownership
  const draft = await db.query.listingDrafts.findFirst({
    where: eq(listingDrafts.id, draftId),
  });

  if (!draft || draft.sellerId !== userId) {
    throw new Error("Draft not found or unauthorized");
  }

  const formData = draft.data as any;

  // 2. Verify Seller Profile / KYC (If not demo)
  const seller = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });

  if (!seller) {
    throw new Error("Only registered sellers can publish listings.");
  }

  // Demo bypass: just return a fake ID without DB writes
  if (isDemo) {
    return 999999;
  }

  // 3. Construct Canonical Title
  let canonicalTitle = `${formData.year || ''} ${formData.set || ''} ${formData.subject || ''}`.trim();
  if (formData.cardNumber) {
    canonicalTitle += ` #${formData.cardNumber}`;
  }
  if (formData.edition) {
    canonicalTitle += ` ${formData.edition}`;
  }
  // Fallback if somehow completely empty
  if (!canonicalTitle.trim()) {
    canonicalTitle = "Unknown Card";
  }

  // 4. Database Transaction
  const listingId = await db.transaction(async (tx) => {
    // a. Insert Card
    const [newCard] = await tx.insert(cards).values({
      ownerId: userId,
      title: canonicalTitle,
      category: "Trading Cards",
      set: formData.set || null,
      year: formData.year || null,
      cardNumber: formData.cardNumber || null,
      condition: formData.condition || "Ungraded",
      gradingCompany: formData.gradingCompany || null,
      grade: formData.grade || null,
      description: formData.description || null,
    }).returning();

    // b. Insert Photos
    if (formData.photos && formData.photos.length > 0) {
      const photosToInsert = formData.photos.map((p: any) => ({
        cardId: newCard.id,
        kind: p.kind || "front",
        sortOrder: p.sortOrder || 0,
        storagePath: p.url, // Storing full URL for V1
      }));
      await tx.insert(itemPhotos).values(photosToInsert);
    }

    // c. Insert Listing if not binder mode
    let returnId = newCard.id; // Default return cardId for binder
    if (formData.mode !== "binder") {
      const priceCents = Math.round(parseFloat(formData.price || "0") * 100);
      const [newListing] = await tx.insert(listings).values({
        sellerId: userId,
        cardId: newCard.id,
        title: canonicalTitle,
        category: "Trading Cards",
        set: formData.set || null,
        year: formData.year || null,
        cardNumber: formData.cardNumber || null,
        condition: formData.condition || "Ungraded",
        gradingCompany: formData.gradingCompany || null,
        grade: formData.grade || null,
        description: formData.description || null,
        priceCents,
        quantity: formData.quantity || 1,
        edition: formData.edition || null,
        graded: formData.graded || false,
        shippingMethod: formData.shippingMethod || "seller_managed",
        storefrontId: formData.storefrontId || null,
      }).returning();
      returnId = newListing.id;
    }

    // d. Set Grail if null
    if (!seller.grailCardId) {
      await tx.update(profiles).set({ grailCardId: newCard.id }).where(eq(profiles.userId, userId));
    }

    // Assign to category if selected
    if (formData.categoryId && formData.categoryId !== "not_exist") {
      await tx.insert(categoryMemberships).values({
        cardId: newCard.id,
        categoryId: parseInt(formData.categoryId, 10)
      }).onConflictDoNothing();
    }

    // e. Delete Draft
    await tx.delete(listingDrafts).where(eq(listingDrafts.id, draftId));

    return returnId;
  });

  // Revalidate cache paths
  revalidatePath("/");
  revalidatePath("/[handle]", "page");
  revalidatePath("/listings/[id]", "page");

  return listingId;
}
