import { db } from "../src/lib/db";
import { listings, users } from "../src/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function main() {
  const user = await db.query.users.findFirst({
    where: eq(users.email, 'junkforcozy@gmail.com')
  });

  if (!user) {
    console.log("User not found");
    process.exit(1);
  }

  const result = await db.update(listings)
    .set({ status: 'pending_marketplace_activation' })
    .where(and(
      eq(listings.sellerId, user.id),
      eq(listings.status, 'active')
    ));

  console.log("Updated listings:", result);
  process.exit(0);
}

main().catch(console.error);
