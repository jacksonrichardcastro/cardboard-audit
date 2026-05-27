import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, profiles, cards, listings, itemPhotos } from "./schema";
import { eq } from "drizzle-orm";
import { env } from "@/env";
import { mockListings } from "../mock/listings"; 

async function main() {
  console.log("Initializing database seed sequence for Phase 2...");
  const queryClient = postgres(env.DATABASE_URL);
  const db = drizzle(queryClient);

  try {
    // 1. Buyer: alexthegrader
    const BUYER_ID = "buyer-alex";
    await db.insert(users).values({
      id: BUYER_ID,
      email: "buyer@mock.com",
      accountType: "buyer",
    }).onConflictDoUpdate({ target: users.id, set: { accountType: "buyer" } });

    await db.insert(profiles).values({
      userId: BUYER_ID,
      handle: "alexthegrader",
      displayName: "Alex 'The Grader' Chen",
      bio: "Expert Collector | PSA 10 Specialist | Trax Trusted Seller since 2018 | Curating Rarity",
      businessName: "Alex The Grader",
      avatarUrl: "/mock/avatar_alex_chen.png",
      kycStatus: "unverified",
      badges: ["ambassador", "verified", "founding"],
    }).onConflictDoUpdate({ target: profiles.userId, set: { handle: "alexthegrader" } });

    // Insert some cards for buyer
    let grailCardId = null;
    for (let i = 0; i < 5; i++) {
      const item = mockListings[i % mockListings.length];
      const [newCard] = await db.insert(cards).values({
        ownerId: BUYER_ID,
        title: item.title,
        category: item.category,
        subcategory: item.subcategory || "Other",
        condition: item.condition,
        gradingCompany: item.gradingCompany,
        grade: item.grade,
        description: item.description || "Mint condition",
      }).returning({ id: cards.id });

      if (item.photoUrl) {
        await db.insert(itemPhotos).values({ cardId: newCard.id, kind: "front", sortOrder: 0, storagePath: item.photoUrl });
      }
      
      if (i === 0) grailCardId = newCard.id;
    }
    if (grailCardId) {
      await db.update(profiles).set({ grailCardId }).where(eq(profiles.userId, BUYER_ID));
    }

    // 2. Seller: storefront_test
    const SELLER_ID = "seller-storefront";
    await db.insert(users).values({
      id: SELLER_ID,
      email: "seller@mock.com",
      accountType: "seller",
    }).onConflictDoUpdate({ target: users.id, set: { accountType: "seller" } });

    await db.insert(profiles).values({
      userId: SELLER_ID,
      handle: "storefront_test",
      displayName: "Alex 'The Grader' Chen",
      bio: "Expert Collector | PSA 10 Specialist | Trax Trusted Seller since 2018 | Curating Rarity",
      businessName: "Storefront Test Shop",
      avatarUrl: "/mock/avatar_alex_chen.png",
      headerStyle: "cards",
      kycStatus: "verified",
      stripeConnectAccountId: "acct_verified_seller",
      badges: ["founding", "certified", "verified"],
    }).onConflictDoUpdate({ target: profiles.userId, set: { handle: "storefront_test" } });

    // Insert 60 cards, and 55 listings
    let insertedListings = 0;
    let sellerGrailCardId = null;
    let extendedListings = [...mockListings, ...mockListings, ...mockListings, ...mockListings].slice(0, 60);

    for (let i = 0; i < extendedListings.length; i++) {
      const item = extendedListings[i];
      const isSlab = i % 3 === 0; // Fake some as slabs
      
      const [newCard] = await db.insert(cards).values({
        ownerId: SELLER_ID,
        title: item.title + ` #${i}`, // Ensure unique titles
        category: item.category,
        subcategory: item.subcategory || "Other",
        condition: item.condition,
        gradingCompany: item.gradingCompany || (isSlab ? "PSA" : null),
        grade: item.grade || (isSlab ? "10" : null),
        description: item.description,
      }).returning({ id: cards.id });

      if (item.photoUrl) {
        await db.insert(itemPhotos).values({ cardId: newCard.id, kind: "front", sortOrder: 0, storagePath: item.photoUrl });
      }

      if (i === 0) sellerGrailCardId = newCard.id;

      // Create a listing for the first 55 cards
      if (i < 55) {
        await db.insert(listings).values({
          sellerId: SELLER_ID,
          cardId: newCard.id,
          title: item.title + ` #${i}`,
          category: item.category,
          subcategory: item.subcategory || "Other",
          condition: item.condition,
          gradingCompany: item.gradingCompany || (isSlab ? "PSA" : null),
          grade: item.grade || (isSlab ? "10" : null),
          description: item.description,
          priceCents: Math.floor(Math.random() * 500000) + 1000, // random price between $10 and $5000
          status: "ACTIVE",
        });
        insertedListings++;
      }
    }
    
    if (sellerGrailCardId) {
      await db.update(profiles).set({ grailCardId: sellerGrailCardId }).where(eq(profiles.userId, SELLER_ID));
    }

    // 3. Private Binder Seller
    const PRIVATE_ID = "seller-private";
    await db.insert(users).values({
      id: PRIVATE_ID,
      email: "private@mock.com",
      accountType: "seller",
    }).onConflictDoUpdate({ target: users.id, set: { accountType: "seller" } });

    await db.insert(profiles).values({
      userId: PRIVATE_ID,
      handle: "private_binder",
      displayName: "Private Collector",
      businessName: "Private Vault",
      headerStyle: "cards",
      kycStatus: "verified",
      binderPrivate: true,
      stripeConnectAccountId: "acct_private_seller",
    }).onConflictDoUpdate({ target: profiles.userId, set: { handle: "private_binder" } });

    for (let i = 0; i < 5; i++) {
      const item = mockListings[i % mockListings.length];
      const [newCard] = await db.insert(cards).values({
        ownerId: PRIVATE_ID,
        title: item.title + " (Private)",
        category: item.category,
        subcategory: item.subcategory || "Other",
        condition: item.condition,
      }).returning({ id: cards.id });

      await db.insert(listings).values({
        sellerId: PRIVATE_ID,
        cardId: newCard.id,
        title: item.title + " (Private)",
        category: item.category,
        condition: item.condition,
        priceCents: 5000,
        status: "ACTIVE",
      });
    }

    console.log(`Success! Inserted ${insertedListings} active listings for Storefront Seller!`);

  } catch (error) {
    console.error("Critical error firing Database Seed sequence:", error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
}

main();
