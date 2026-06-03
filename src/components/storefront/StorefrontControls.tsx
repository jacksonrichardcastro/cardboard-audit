import { db } from "@/lib/db";
import { categories, cards } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { StorefrontControlsClient } from "./StorefrontControlsClient";
import { auth } from "@clerk/nextjs/server";

export async function StorefrontControls({ layout, sellerId, sellerHandle, isPreview, cards: binderCards, headerIds }: { layout: "grid" | "categories", sellerId: string, sellerHandle: string, isPreview: boolean, cards: any[], headerIds: number[] }) {
  const { userId } = await auth();
  if (userId !== sellerId) return null;
  
  const userCategories = await db.query.categories.findMany({
    where: eq(categories.userId, sellerId),
    orderBy: (c) => [c.displayOrder]
  });
  
  // get user's cards to extract unique sports, years, sets, grades
  const userCards = await db.select({
    sport: cards.sport,
    year: cards.year,
    set: cards.set,
    gradeTier: cards.gradeTier,
    category: cards.category
  }).from(cards).where(eq(cards.ownerId, sellerId));

  const sportsSet = new Set(userCards.map(c => c.sport).filter(Boolean));
  if (userCards.some(c => c.category === "TCG")) sportsSet.add("TCG");
  if (userCards.some(c => c.category === "Non-Sport")) sportsSet.add("Non-Sport");
  
  const sports = Array.from(sportsSet);
  const years = Array.from(new Set(userCards.map(c => c.year).filter(Boolean))).sort((a, b) => (b as string).localeCompare(a as string));
  const brands = Array.from(new Set(userCards.map(c => c.set).filter(Boolean))).sort();
  const grades = Array.from(new Set(userCards.map(c => c.gradeTier).filter(Boolean))).sort();

  return <StorefrontControlsClient layout={layout} categories={userCategories} sports={sports as string[]} years={years as string[]} brands={brands as string[]} grades={grades as string[]} isPreview={isPreview} binderCards={binderCards} headerIds={headerIds} sellerHandle={sellerHandle} />;
}
