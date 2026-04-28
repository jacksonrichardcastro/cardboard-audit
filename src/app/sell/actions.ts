"use server";

import { db } from "@/lib/db";
import { listingDrafts, sellers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createDraft(initialData: any = {}) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Ensure seller profile exists and is approved (per Phase 4 gate, but re-checked here)
  const seller = await db.query.sellers.findFirst({
    where: eq(sellers.userId, userId),
  });

  if (!seller || seller.applicationStatus !== "approved") {
    throw new Error("Only approved sellers can create listings");
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
