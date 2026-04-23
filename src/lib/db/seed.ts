import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, sellers, listings } from "./schema";
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
      businessName: "Cardbound Premium Store",
      description: "Official prototype vendor mock.",
      identityVerified: true,
      applicationStatus: "APPROVED",
      stripeConnectAccountId: "acct_stubbed_verified",
    }).onConflictDoNothing({ target: sellers.userId });

    console.log("Mock seller profile configured stably.");

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
        photos: [item.photoUrl], // Inject primary public local asset URL here
        status: "ACTIVE", 
      };

      // Utilize DB native boundaries tracking unique constraint exactly
      await db.insert(listings).values(insertPayload)
        .onConflictDoNothing({ target: [listings.title, listings.sellerId] });
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
