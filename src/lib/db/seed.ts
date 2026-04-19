import { db } from "./index";
import { users, sellers, listings, orders, stateTransitions } from "./schema";

const STATES = [
  "PAID",
  "SELLER_RECEIVED",
  "PACKAGED",
  "SHIPPED",
  "IN_TRANSIT",
  "DELIVERED",
  "BUYER_CONFIRMED",
  "DISPUTED",
];

async function seed() {
  console.log("🌱 Starting CardBound Database Seeding...");

  try {
    // 1. Create Sellers and Buyers
    console.log("👤 Creating Users (3 Sellers, 2 Buyers)...");
    const createdUsers = await db.insert(users).values([
      { id: "user_seller_1", email: "seller1@example.com", role: "seller" },
      { id: "user_seller_2", email: "seller2@example.com", role: "seller" },
      { id: "user_seller_3", email: "seller3@example.com", role: "seller" },
      { id: "user_buyer_1", email: "buyer1@example.com", role: "buyer" },
      { id: "user_buyer_2", email: "buyer2@example.com", role: "buyer" },
    ]).returning();

    // 2. Create Seller Profiles for the 3 Sellers (all approved)
    console.log("🏬 Creating Approved Seller Profiles...");
    const createdSellers = await db.insert(sellers).values([
      { userId: "user_seller_1", businessName: "Vanguard Vault", description: "Top tier rare TCG items.", identityVerified: true, applicationStatus: "approved", stripeConnectAccountId: "acct_test1" },
      { userId: "user_seller_2", businessName: "Retro Breaks", description: "Vintage sports cards straight from the slab.", identityVerified: true, applicationStatus: "approved", stripeConnectAccountId: "acct_test2" },
      { userId: "user_seller_3", businessName: "CardBound Founding Seller", description: "First approved seller.", identityVerified: true, applicationStatus: "approved", stripeConnectAccountId: "acct_test3" },
    ]).returning();

    // 3. Create 50 Listings
    console.log("🃏 Creating 50 Mock Listings...");
    const mockListingsData = Array.from({ length: 50 }).map((_, i) => ({
      sellerId: createdSellers[i % 3].userId,
      title: `Gem Mint Card ${i + 1}`,
      category: i % 2 === 0 ? "Sports" : "TCG",
      subcategory: i % 2 === 0 ? "Basketball" : "Pokemon",
      condition: "Mint",
      gradingCompany: "PSA",
      grade: "10",
      description: `Incredible card for collectors. ID: ${i}`,
      priceCents: 5000 + (Math.floor(Math.random() * 20000)), // anywhere from $50.00 to $250.00
      quantity: 1,
      photos: ["https://placehold.co/400x500/171717/ededed?text=Card+" + (i + 1)],
    }));

    const createdListings = await db.insert(listings).values(mockListingsData).returning();

    // 4. Create Orders testing states
    console.log("🛒 Creating Orders for State Transparency Ledger...");
    
    // We want 2 orders in each state
    const createdOrders = [];
    const transitions = [];

    let orderCounter = 0;

    for (const state of STATES) {
      for (let j = 0; j < 2; j++) {
        const listing = createdListings[orderCounter % 50]; // assign a listing
        const price = listing.priceCents;
        const shipping = 500;
        const total = price + shipping;

        const order = await db.insert(orders).values({
          buyerId: "user_buyer_1",
          sellerId: listing.sellerId,
          listingId: listing.id,
          currentState: state,
          priceCentsAtSale: price,
          taxCents: 0,
          shippingCents: shipping,
          totalCents: total,
          feeCents: Math.floor(price * 0.05), // 5% fee mock
          stripePaymentIntentId: `pi_mock_${orderCounter}`,
        }).returning();

        createdOrders.push(order[0]);

        // simulate states sequentially up to the current state
        const stateIndex = STATES.indexOf(state);
        let previousState = null;

        for (let s = 0; s <= stateIndex; s++) {
          const currentStateIter = STATES[s];
          transitions.push({
            orderId: order[0].id,
            previousState: previousState,
            newState: currentStateIter,
            actorId: s === 0 ? order[0].buyerId : order[0].sellerId, // simplified
            notes: `State moved to ${currentStateIter}`,
            trackingNumber: currentStateIter === "SHIPPED" ? `1Z99999999999${orderCounter}` : null,
            carrier: currentStateIter === "SHIPPED" ? "UPS" : null,
          });
          previousState = currentStateIter;
        }

        orderCounter++;
      }
    }

    console.log("🚂 Adding 10 additional completed orders (BUYER_CONFIRMED)...");
    for (let k = 0; k < 10; k++) {
      const listing = createdListings[orderCounter % 50];
      const price = listing.priceCents;
      const order = await db.insert(orders).values({
          buyerId: "user_buyer_2",
          sellerId: listing.sellerId,
          listingId: listing.id,
          currentState: "BUYER_CONFIRMED",
          priceCentsAtSale: price,
          taxCents: 0,
          shippingCents: 500,
          totalCents: price + 500,
          feeCents: Math.floor(price * 0.05),
          stripePaymentIntentId: `pi_mock_completed_${k}`,
      }).returning();
      
      transitions.push({
        orderId: order[0].id,
        previousState: "DELIVERED",
        newState: "BUYER_CONFIRMED",
        actorId: order[0].buyerId, 
        notes: "Buyer confirmed receipt."
      });
      orderCounter++;
    }

    if (transitions.length > 0) {
      await db.insert(stateTransitions).values(transitions);
    }

    console.log("✅ Seeding Complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Failed:");
    console.error(error);
    process.exit(1);
  }
}

seed();
