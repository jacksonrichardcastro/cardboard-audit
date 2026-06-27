import { db } from "@/lib/db";
import { cardSets, setSubsets, catalogCards, cardParallels, pullOdds } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const existingSet = await db.query.cardSets.findFirst({ where: eq(cardSets.slug, '2026-topps-series-2-baseball') });
  if (!existingSet) {
    console.log("Set not found!");
    process.exit(1);
  }

  const oddsCount = await db.select().from(pullOdds).where(eq(pullOdds.setId, existingSet.id));
  const parallelsCount = await db.select().from(cardParallels).where(eq(cardParallels.setId, existingSet.id));
  const cardsCount = await db.select().from(catalogCards).where(eq(catalogCards.setId, existingSet.id));
  const subsetsCount = await db.select().from(setSubsets).where(eq(setSubsets.setId, existingSet.id));

  console.log(`SET TO PRUNE: ${existingSet.id} (${existingSet.slug})`);
  console.log(`- pull_odds: ${oddsCount.length} rows`);
  console.log(`- card_parallels: ${parallelsCount.length} rows`);
  console.log(`- catalog_cards: ${cardsCount.length} rows`);
  console.log(`- set_subsets: ${subsetsCount.length} rows`);

  process.exit(0);
}
main().catch(console.error);
