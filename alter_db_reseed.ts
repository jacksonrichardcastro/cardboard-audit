import { db } from "./src/lib/db";
import { listings, profiles, offers } from "./src/lib/db/schema";
import { eq, inArray, ilike } from "drizzle-orm";

async function run() {
  const alex = await db.query.profiles.findFirst({
    where: eq(profiles.handle, "alexthegrader")
  });
  if (!alex) throw new Error("No alex found");

  const testUsers = [
    "user_3CyGNCve6RQR6zoPQmkKCLY1PXD",
    "user_3EUzuoMtvk1ic1V4qF5pR3AI9E7"
  ];
  
  // Reassign all seed listings to alexthegrader
  await db.update(listings)
    .set({ sellerId: alex.userId })
    .where(inArray(listings.sellerId, testUsers));
  
  // Delete the 4 test offers
  await db.delete(offers)
    .where(inArray(offers.buyerId, [...testUsers, "user_3CvnSvM4NiL0XhncgIKOVbmaiKl"]));

  // Fix ordering by setting createdAt
  const now = new Date();
  
  // Colorful cards to front (newest)
  await db.update(listings)
    .set({ createdAt: new Date(now.getTime() + 100000) })
    .where(ilike(listings.title, "%Charizard%"));
    
  await db.update(listings)
    .set({ createdAt: new Date(now.getTime() + 90000) })
    .where(ilike(listings.title, "%Aaron Judge%"));
    
  await db.update(listings)
    .set({ createdAt: new Date(now.getTime() + 80000) })
    .where(ilike(listings.title, "%Pikachu%"));

  // Push Luka down
  await db.update(listings)
    .set({ createdAt: new Date(now.getTime() - 10000000) })
    .where(ilike(listings.title, "%Luka Doncic%"));
    
  // Deactivate the $125 blank listing instead of deleting
  await db.update(listings).set({ status: 'INACTIVE' }).where(eq(listings.priceCents, 12500));

  console.log("DB remediation complete");
  process.exit(0);
}
run().catch(console.error);
