import { describe, it, expect, beforeAll, vi } from "vitest";
import { db, withUserContext } from "@/lib/db";
import { orders, users, listings, sellers } from "@/lib/db/schema";
import { POST } from "@/app/api/cron/payout-sweeper/route";
import { eq } from "drizzle-orm";

// Mock Stripe so transfers.create does not hit the network in CI.
vi.mock("stripe", () => ({
  default: class StripeMock {
    transfers = {
      create: vi.fn().mockResolvedValue({ id: "tr_mock123" })
    }
  }
}));

describe("P0-7: Cron Payout Sweeper Integration", () => {
  beforeAll(async () => {
    // Seed fixtures under system context so RLS policies allow the inserts.
    // Uses onConflictDoNothing so reruns against a dirty DB do not blow up.
    await withUserContext("system", async (tx) => {
      await tx.insert(users).values([
        { id: "user_buyer", email: "buyer@test.local", role: "buyer" },
        { id: "user_seller", email: "seller@test.local", role: "seller" },
      ]).onConflictDoNothing();

      await tx.insert(sellers).values([
        {
          userId: "user_seller",
          businessName: "Test Seller Shop",
          stripeConnectAccountId: "acct_test_seller",
          applicationStatus: "approved",
        },
      ]).onConflictDoNothing();

      await tx.insert(listings).values([
        {
          id: 1,
          sellerId: "user_seller",
          title: "Test Listing",
          category: "TCG",
          condition: "Mint",
          priceCents: 100,
        },
      ]).onConflictDoNothing();
    });
  });

  it("auto-confirms orders past the 72h delivery threshold and leaves newer orders untouched", async () => {
    const orderEarlyId = 9001; // T = 71h  (inside the escrow window; must stay PENDING)
    const orderLateId = 9002;  // T = 73h  (past the window; must flip to BUYER_CONFIRMED)

    await withUserContext("system", async (tx) => {
      await tx.insert(orders).values([
        {
          id: orderEarlyId,
          buyerId: "user_buyer",
          sellerId: "user_seller",
          listingId: 1,
          currentState: "PENDING_BUYER_CONFIRM",
          priceCentsAtSale: 100,
          totalCents: 100,
          deliveredAt: new Date(Date.now() - (71 * 60 * 60 * 1000)),
        },
        {
          id: orderLateId,
          buyerId: "user_buyer",
          sellerId: "user_seller",
          listingId: 1,
          currentState: "PENDING_BUYER_CONFIRM",
          priceCentsAtSale: 100,
          totalCents: 100,
          deliveredAt: new Date(Date.now() - (73 * 60 * 60 * 1000)),
        },
      ]).onConflictDoNothing();
    });

    // Invoke the real cron route handler with a valid bearer token.
    const request = new Request("http://localhost/api/cron/payout-sweeper", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    // Verify the early order stayed locked and the late order got released.
    const [earlyOrder] = await withUserContext("system", async (tx) =>
      tx.select().from(orders).where(eq(orders.id, orderEarlyId))
    );
    const [lateOrder] = await withUserContext("system", async (tx) =>
      tx.select().from(orders).where(eq(orders.id, orderLateId))
    );

    expect(earlyOrder.currentState).toBe("PENDING_BUYER_CONFIRM");
    expect(lateOrder.currentState).toBe("BUYER_CONFIRMED");
  });
});
