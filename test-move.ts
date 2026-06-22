import { db } from "./src/lib/db";
import { listings, storefronts, categories, categoryMemberships } from "./src/lib/db/schema";
import { eq, inArray, and, sql } from "drizzle-orm";

async function main() {
  const allStorefronts = await db.select({ userId: storefronts.userId, id: storefronts.id }).from(storefronts);
  const userCounts: Record<string, number> = allStorefronts.reduce((acc: any, s: any) => {
    acc[s.userId] = (acc[s.userId] || 0) + 1;
    return acc;
  }, {});
  const devUserId = Object.keys(userCounts).find(uid => userCounts[uid] >= 2);
  
  if (!devUserId) {
    console.log("No dev user with 2+ storefronts found.");
    process.exit(0);
  }

  const userStores = await db.select().from(storefronts).where(eq(storefronts.userId, devUserId));
  const store1 = userStores[0].id;
  const store2 = userStores[1].id;

  const targetCategory = await db.query.categories.findFirst({ where: eq(categories.storefrontId, store2) });

  const listingsToMove = await db.select({ id: listings.id }).from(listings).where(eq(listings.storefrontId, store1)).limit(2);
  const listingIds = listingsToMove.map((l: any) => l.id);

  if (listingIds.length === 0) {
    console.log("No listings to move.");
    process.exit(0);
  }

  const fullListings = await db.query.listings.findMany({
    where: inArray(listings.id, listingIds),
    with: {
      card: {
        with: {
          categoryMemberships: {
            with: { category: true }
          }
        }
      }
    }
  });

  const preStateData = fullListings.map((l: any) => ({
    listing_id: l.id,
    old_storefront_id: l.storefrontId,
    card_id: l.cardId,
    category_memberships: l.card?.categoryMemberships.map((cm: any) => cm.categoryId) || []
  }));

  console.log(JSON.stringify({
    event: "bulk_move_pre_state",
    listings: preStateData
  }, null, 2));
  
  process.exit(0);
}
main().catch(console.error);
