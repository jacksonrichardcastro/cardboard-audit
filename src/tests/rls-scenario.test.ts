import { describe, it, expect, beforeAll } from "vitest";
import { db, withUserContext } from "@/lib/db";
import { orders, users, listings, sellers } from "@/lib/db/schema";

describe("P0-5 Scenario 3: Cross-Tenant RLS Isolation", () => {
  beforeAll(async () => {
    // Seed users, seller, listing, and two orders (one for user_A, one for user_B)
    // under system context so the inserts bypass per-user RLS policies.
    await withUserContext("system", async (tx) => {
      await tx.insert(users).values([
        { id: "user_A", email: "a@test.local", role: "buyer" },
        { id: "user_B", email: "b@test.local", role: "buyer" },
        { id: "user_owner", email: "owner@test.local", role: "seller" },
      ]).onConflictDoNothing();

      await tx.insert(sellers).values([
        {
          userId: "user_owner",
          businessName: "Owner Shop",
          stripeConnectAccountId: "acct_owner_test",
          applicationStatus: "approved",
        },
      ]).onConflictDoNothing();

      await tx.insert(listings).values([
        {
          id: 500,
          sellerId: "user_owner",
          title: "Shared Listing",
          category: "TCG",
          condition: "Mint",
          priceCents: 100,
        },
      ]).onConflictDoNothing();

      await tx.insert(orders).values([
        {
          id: 501,
          buyerId: "user_B",
          sellerId: "user_owner",
          listingId: 500,
          currentState: "PAID",
          priceCentsAtSale: 100,
          totalCents: 100,
        },
        {
          id: 502,
          buyerId: "user_A",
          sellerId: "user_owner",
          listingId: 500,
          currentState: "PAID",
          priceCentsAtSale: 100,
          totalCents: 100,
        },
      ]).onConflictDoNothing();
    });
  });

  it("under user_A context, SELECT orders returns only user_A's rows — user_B is invisible even without app-layer filter", async () => {
    // Run as user_A and deliberately omit any WHERE filter on buyer_id.
    // If RLS is doing its job, Postgres itself should filter out user_B's order.
    const retrieved = await withUserContext("user_A", async (tx) => {
      return await tx.select({
        id: orders.id,
        buyerId: orders.buyerId,
        sellerId: orders.sellerId,
      }).from(orders);
    });

    // Must be non-empty (user_A's own order should be visible)
    expect(retrieved.length).toBeGreaterThan(0);

    // Every returned row must belong to user_A — as buyer or seller.
    // If user_B's row appears here, RLS is NOT enforcing.
    for (const row of retrieved) {
      expect(
        row.buyerId === "user_A" || row.sellerId === "user_A"
      ).toBe(true);
    }

    // Explicitly confirm user_B's seeded order is NOT in the result set.
    const leakedRow = retrieved.find((r: any) => r.id === 501);
    expect(leakedRow).toBeUndefined();
  });
});
