import { db } from './src/lib/db/index.js';
import { listings, profiles, cards, categoryMemberships } from './src/lib/db/schema.js';
import { sql, eq, inArray, isNull } from 'drizzle-orm';

async function main() {
  console.log("Starting migration...");

  try {
    // Step 1: DDL Migration
    console.log("Dropping NOT NULL constraint on price_cents...");
    await db.execute(sql`ALTER TABLE listings ALTER COLUMN price_cents DROP NOT NULL;`);
    console.log("DDL Migration complete.");

    // Step 2: Data Migration
    // Find all cards in profiles.headerCustomizationIds
    const allProfiles = await db.select({
      userId: profiles.userId,
      headerCustomizationIds: profiles.headerCustomizationIds
    }).from(profiles);

    const cardIdsInHeaders = new Set<number>();
    for (const p of allProfiles) {
      if (Array.isArray(p.headerCustomizationIds)) {
        for (const id of p.headerCustomizationIds) {
          if (typeof id === 'number') cardIdsInHeaders.add(id);
        }
      }
    }

    if (cardIdsInHeaders.size === 0) {
      console.log("No cards found in header customizations.");
      return;
    }

    const cardIds = Array.from(cardIdsInHeaders);
    
    // Check which of these cards already have listings
    const existingListings = await db.select({
      cardId: listings.cardId
    }).from(listings).where(inArray(listings.cardId, cardIds));

    const cardsWithListings = new Set(existingListings.map(l => l.cardId));

    const cardsWithoutListings = cardIds.filter(id => !cardsWithListings.has(id));

    if (cardsWithoutListings.length === 0) {
      console.log("All header cards already have listings. No migration needed.");
      return;
    }

    // Get the details for the cards without listings
    const cardsToMigrate = await db.select().from(cards).where(inArray(cards.id, cardsWithoutListings));

    console.log(`Found ${cardsToMigrate.length} binder-only cards in headers. Migrating...`);

    const newDrafts = cardsToMigrate.map(card => ({
      sellerId: card.ownerId,
      cardId: card.id,
      title: card.title,
      category: card.category,
      subcategory: card.subcategory,
      set: card.set,
      year: card.year,
      sport: card.sport,
      listingType: card.listingType,
      gradeTier: card.gradeTier,
      era: card.era,
      cardNumber: card.cardNumber,
      condition: card.condition,
      gradingCompany: card.gradingCompany,
      grade: card.grade,
      description: card.description,
      priceCents: null as unknown as number, // bypass TS type checking for Drizzle insert
      status: 'draft',
      quantity: 1,
    }));

    // Insert the drafts
    await db.insert(listings).values(newDrafts);
    
    const uniqueSellers = new Set(newDrafts.map(d => d.sellerId)).size;
    console.log(`Inserted ${newDrafts.length} draft listings for ${uniqueSellers} sellers.`);

  } catch (error) {
    console.error("Migration failed:", error);
  }

  process.exit(0);
}

main();
