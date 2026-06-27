import { db } from "../src/lib/db";
import { catalogCards } from "../src/lib/db/schema";
import { isNull, eq } from "drizzle-orm";

export function normalizeForSearch(str: string) {
  if (!str) return "";
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function run() {
  console.log("Fetching cards with NULL name_normalized...");
  const cards = await db.query.catalogCards.findMany({
    where: isNull(catalogCards.nameNormalized),
  });
  console.log(`Found ${cards.length} cards to backfill.`);

  let updated = 0;
  for (const card of cards) {
    const norm = normalizeForSearch(card.subject);
    await db.update(catalogCards)
      .set({ nameNormalized: norm })
      .where(eq(catalogCards.id, card.id));
    updated++;
    if (updated % 500 === 0) {
      console.log(`Updated ${updated}/${cards.length} cards...`);
    }
  }

  console.log(`Finished backfilling ${updated} cards.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Failed backfill:", err);
  process.exit(1);
});
