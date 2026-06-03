"use server";

import { db } from "@/lib/db";
import { categories, cards, categoryMemberships } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function bulkAddCardsToCategory(categoryId: number, cardIds: number[]) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("401 Unauthorized");
  }

  // Verify category ownership
  const category = await db.query.categories.findFirst({
    where: eq(categories.id, categoryId)
  });

  if (!category || category.userId !== userId) {
    throw new Error("403 Forbidden: You do not own this category");
  }

  if (cardIds.length === 0) {
    return { success: true };
  }

  // Verify ownership of all cards
  const userCards = await db.query.cards.findMany({
    where: inArray(cards.id, cardIds)
  });

  if (userCards.length !== cardIds.length) {
    throw new Error("403 Forbidden: One or more cards not found or not owned by you");
  }

  for (const card of userCards) {
    if (card.ownerId !== userId) {
      throw new Error("403 Forbidden: You do not own one or more of these cards");
    }
  }

  // Insert memberships
  const values = cardIds.map(cardId => ({
    categoryId,
    cardId
  }));

  // Handle potential duplicates (ON CONFLICT DO NOTHING)
  // Drizzle doesn't have onConflictDoNothing in core query builder for postgres easily without sql`` sometimes,
  // but we can just use an insert with onConflictDoNothing
  await db.insert(categoryMemberships)
    .values(values)
    .onConflictDoNothing();

  revalidatePath("/", "layout");
  return { success: true };
}
