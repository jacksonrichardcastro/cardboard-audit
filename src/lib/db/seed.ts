import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, sellers, listings, listingPhotos } from "./schema";
import { eq } from "drizzle-orm";
import { env } from "@/env";
import { mockListings } from "../mock/listings"; // Use existing mock arrays to dynamically power the Drizzle seed script natively

async function main() {
  console.log("Initializing database seed sequence...");
  const queryClient = postgres(env.DATABASE_URL);
  const db = drizzle(queryClient);

  try {
    const MOCK_SELLER_ID = "mock-seller-1";

    // 1. Idempotent Upsert for the Mock User
    console.log("Upserting stub user...");
    await db.insert(users).values({
      id: MOCK_SELLER_ID,
      email: "shop@mock-seller.com",
      role: "seller",
    }).onConflictDoNothing({ target: users.id });

    // 2. Idempotent Upsert for the Mock Seller linking valid Stripe configs
    console.log("Upserting stub seller details...");
    await db.insert(sellers).values({
      userId: MOCK_SELLER_ID,
      handle: "alexthegrader",
      displayName: "Alex 'The Grader' Chen",
      bio: "Expert Collector | PSA 10 Specialist | Trax Trusted Seller since 2018 | Curating Rarity",
      locationCity: "New York, NY",
      businessName: "Alex The Grader",
      description: "Official prototype vendor mock.",
      identityVerified: true,
      applicationStatus: "APPROVED",
      stripeConnectAccountId: "acct_stubbed_verified",
      headerStyle: "cards",
    }).onConflictDoUpdate({ 
      target: sellers.userId, 
      set: { 
        handle: "alexthegrader",
        displayName: "Alex 'The Grader' Chen",
        bio: "Expert Collector | PSA 10 Specialist | Trax Trusted Seller since 2018 | Curating Rarity",
        headerStyle: "cards"
      } 
    });

    console.log("Mock seller profile configured stably.");

    const MOCK_SELLER_ID_2 = "mock-seller-banner";

    // 2b. Add a second test seller with banner header style
    console.log("Upserting stub user 2 (banner test)...");
    await db.insert(users).values({
      id: MOCK_SELLER_ID_2,
      email: "banner@mock-seller.com",
      role: "seller",
    }).onConflictDoNothing({ target: users.id });

    await db.insert(sellers).values({
      userId: MOCK_SELLER_ID_2,
      handle: "banner_test",
      displayName: "Banner Test Shop",
      bio: "Testing the new banner header option.",
      locationCity: "Austin, TX",
      businessName: "Banner Test",
      description: "Banner test shop.",
      identityVerified: true,
      applicationStatus: "APPROVED",
      stripeConnectAccountId: "acct_stubbed_banner",
      headerStyle: "banner",
      bannerImageUrl: "https://placehold.co/1500x400/1a1a1a/7C3AED?text=Banner+Test",
    }).onConflictDoUpdate({ 
      target: sellers.userId, 
      set: { 
        handle: "banner_test",
        displayName: "Banner Test Shop",
        bio: "Testing the new banner header option.",
        headerStyle: "banner",
        bannerImageUrl: "https://placehold.co/1500x400/1a1a1a/7C3AED?text=Banner+Test",
      } 
    });

    console.log("Banner test seller profile configured stably.");

    // 3. Migrate local mock data arrays natively into the db listings matrix
    console.log("Deploying robust explicit listing boundaries...");
    let inserted = 0;
    for (const item of mockListings) {
      // Clean parsing explicit string limits dynamically back into schema fields
      const parsedSet = item.set || "Base Set";
      
      const insertPayload = {
        title: item.title,
        sellerId: MOCK_SELLER_ID,
        category: item.category,
        subcategory: item.subcategory || "Other",
        condition: item.condition,
        gradingCompany: item.gradingCompany,
        grade: item.grade,
        description: item.description || "Mint condition stored completely flawlessly natively.",
        priceCents: item.priceCents,
        status: "ACTIVE", 
      };

      // Utilize DB native boundaries tracking unique constraint exactly
      const [newListing] = await db.insert(listings).values(insertPayload)
        .onConflictDoNothing({ target: [listings.title, listings.sellerId] })
        .returning({ id: listings.id });
      
      let listingId;
      if (newListing) {
        listingId = newListing.id;
      } else {
        const [existing] = await db.select({ id: listings.id }).from(listings).where(eq(listings.title, item.title)).limit(1);
        if (existing) listingId = existing.id;
      }

      if (listingId && item.photoUrl) {
        await db.insert(listingPhotos).values({
          listingId,
          kind: "front",
          sortOrder: 0,
          storagePath: item.photoUrl,
        }).onConflictDoNothing();
      }

      // Set the first listing as the Grail for testing
      if (inserted === 0 && listingId) {
        await db.update(sellers)
          .set({ grailListingId: listingId })
          .where(eq(sellers.userId, MOCK_SELLER_ID));
      }

      inserted++;
    }
    
    console.log(`Success! Inserted ${inserted} active mocked listings correctly avoiding endpoints!`);

  } catch (error) {
    console.error("Critical error firing Database Seed sequence:", error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
}

main();
