"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, categories, cards, categoryMemberships, profiles } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateStorefrontLayout(layout: "grid" | "categories") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await db.update(users).set({ storefrontLayout: layout }).where(eq(users.id, userId));
  
  const [profile] = await db.select({ handle: profiles.handle }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (profile?.handle) {
    revalidatePath(`/${profile.handle}`);
  }
}

export async function addCategory(name: string, isAutoManaged = false) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  // Find highest display order
  const existing = await db.query.categories.findMany({
    where: eq(categories.userId, userId),
    orderBy: (c, { desc }) => [desc(c.displayOrder)]
  });
  const maxOrder = existing.length > 0 ? existing[0].displayOrder : -1;
  
  await db.insert(categories).values({
    userId,
    name,
    isAutoManaged,
    displayOrder: maxOrder + 1,
  });
  
  const [profile] = await db.select({ handle: profiles.handle }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (profile?.handle) {
    revalidatePath(`/${profile.handle}`);
  }
}

export async function removeCategory(categoryId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  await db.delete(categories).where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));
  
  const [profile] = await db.select({ handle: profiles.handle }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (profile?.handle) {
    revalidatePath(`/${profile.handle}`);
  }
}

export async function autoPopulateMyCollection() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  // Ensure 'My Collection' exists
  let [myCollection] = await db.select().from(categories).where(and(eq(categories.userId, userId), eq(categories.name, "My Collection"))).limit(1);
  if (!myCollection) {
    const existing = await db.query.categories.findMany({
      where: eq(categories.userId, userId),
      orderBy: (c, { desc }) => [desc(c.displayOrder)]
    });
    const maxOrder = existing.length > 0 ? existing[0].displayOrder : -1;
    
    [myCollection] = await db.insert(categories).values({
      userId,
      name: "My Collection",
      isAutoManaged: false,
      displayOrder: maxOrder + 1
    }).returning();
  }

  // Fetch all user cards (either owned by user, or linked to an active/pending listing by the user)
  const userCards = await db.select({ id: cards.id })
    .from(cards)
    .leftJoin(listings, eq(cards.id, listings.cardId))
    .where(
      sql`${cards.ownerId} = ${userId} OR (${listings.sellerId} = ${userId} AND ${listings.deletedAt} IS NULL)`
    );
  
  // Insert memberships, ignoring conflicts
  if (userCards.length > 0) {
    await db.insert(categoryMemberships)
      .values(userCards.map(c => ({ cardId: c.id, categoryId: myCollection.id })))
      .onConflictDoNothing();
  }
  
  const [profile] = await db.select({ handle: profiles.handle }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (profile?.handle) {
    revalidatePath(`/${profile.handle}`);
  }
}

export async function autoPopulateCategories() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  // Fetch user categories
  const userCategories = await db.select().from(categories).where(eq(categories.userId, userId));
  const curatedNames = ["Weekly Discounts", "Personal Favorites", "My Collection", "Fresh Pulls", "Investment Grade", "Rookie Watch", "Vault Steals"];
  
  // Only auto-populate non-curated categories (Sport, Year, Brand, Grade Tier)
  const autoDataCategories = userCategories.filter(c => !curatedNames.includes(c.name));
  
  if (autoDataCategories.length === 0) return;
  
  // Fetch all user cards (either owned by user, or linked to an active/pending listing by the user)
  const userCards = await db.select({
      id: cards.id,
      sport: cards.sport,
      year: cards.year,
      set: cards.set,
      gradeTier: cards.gradeTier,
      category: cards.category
    })
    .from(cards)
    .leftJoin(listings, eq(cards.id, listings.cardId))
    .where(
      sql`${cards.ownerId} = ${userId} OR (${listings.sellerId} = ${userId} AND ${listings.deletedAt} IS NULL)`
    );
  
  const membershipsToInsert: {cardId: number, categoryId: number}[] = [];
  
  for (const card of userCards) {
    for (const cat of autoDataCategories) {
      // Check if card matches category name. 
      // Sport: Basketball, etc.
      // Year: 2024, etc.
      // Brand: Prizm, etc (card.set)
      // Grade: PSA 10, etc (card.gradeTier)
      const name = cat.name;
      if (
        card.sport === name ||
        card.year === name ||
        card.set === name ||
        card.gradeTier === name ||
        (card.category === "TCG" && name === "TCG") ||
        (card.category === "Non-Sport" && name === "Non-Sport")
      ) {
        membershipsToInsert.push({ cardId: card.id, categoryId: cat.id });
      }
    }
  }
  
  if (membershipsToInsert.length > 0) {
    await db.insert(categoryMemberships).values(membershipsToInsert).onConflictDoNothing();
  }

  const [profile] = await db.select({ handle: profiles.handle }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (profile?.handle) {
    revalidatePath(`/${profile.handle}`);
  }
}
