import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
vi.mock("@clerk/nextjs", () => ({
    auth: vi.fn().mockResolvedValue({ userId: "user_owner" }),
    currentUser: vi.fn().mockResolvedValue({ id: "user_owner" })
}));
import { db } from "@/lib/db";
import { orders, users, listings, sellers } from "@/lib/db/schema";
import { POST } from "@/app/api/cron/payout-sweeper/route";
import { eq } from "drizzle-orm";

vi.mock("stripe", () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            transfers: {
                create: vi.fn().mockResolvedValue({ id: "tr_mock123" })
            },
            webhooks: {
                constructEvent: vi.fn().mockReturnValue({ id: "evt_duplicate_test", type: "charge.succeeded", data: { object: {} } })
            }
        }))
    }
});

describe("P0-7: Cron Payout Sweeper Integration", () => {
    it("Verifies confirmBuyerReceipt is called exclusively for orders exceeding the 72H Escrow threshold", async () => {
        // This test requires an active Postgres instance to execute.
        // It connects natively asserting records at T=71h and T=73h.
        
        // 1. Seed Orders natively
        const orderEarlyId = 9001; // T = 71H
        const orderLateId = 9002; // T = 73H
        
        // Seed Database Dependencies for empty CI state dynamically
        await db.insert(users).values([
            { id: "user_buyer", email: "b@test.com" },
            { id: "user_seller", email: "s@test.com" }
        ]).onConflictDoNothing();
        
        // P1-8: Mock the Seller required for the Stripe Connect Escrow release!
        await db.insert(sellers).values({
            userId: "user_seller", businessName: "Test Shop", stripeConnectAccountId: "acct_mock123"
        }).onConflictDoNothing();
        
        await db.insert(listings).values({
            id: 1, sellerId: "user_seller", title: "Test", category: "TCG", condition: "Mint", priceCents: 100
        }).onConflictDoNothing();

        await db.insert(orders).values([
            { id: orderEarlyId, buyerId: "user_buyer", sellerId: "user_seller", listingId: 1, currentState: "PENDING_BUYER_CONFIRM", priceCentsAtSale: 100, totalCents: 100, deliveredAt: new Date(Date.now() - (71 * 60 * 60 * 1000)) },
            { id: orderLateId, buyerId: "user_buyer", sellerId: "user_seller", listingId: 1, currentState: "PENDING_BUYER_CONFIRM", priceCentsAtSale: 100, totalCents: 100, deliveredAt: new Date(Date.now() - (73 * 60 * 60 * 1000)) }
        ]).onConflictDoUpdate({
           target: orders.id,
           set: { currentState: "PENDING_BUYER_CONFIRM", deliveredAt: new Date(Date.now() - (73 * 60 * 60 * 1000)) }
        });

        // 2. Trigger the autonomous endpoint natively injecting required Secrets
        const request = new Request("http://localhost/api/cron/payout-sweeper", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.CRON_SECRET}` }
        });
        
        const response = await POST(request);
        expect(response.status).toBe(200);

        // 3. Verify exactly one order remained, and one executed mapping stripe bounds cleanly
        const [earlyOrder] = await db.select().from(orders).where(eq(orders.id, orderEarlyId));
        const [lateOrder] = await db.select().from(orders).where(eq(orders.id, orderLateId));

        expect(earlyOrder.currentState).toBe("PENDING_BUYER_CONFIRM"); // Escrow lock maintained dynamically
        expect(lateOrder.currentState).toBe("BUYER_CONFIRMED"); // Fund constraints autonomously dismissed!
    });
});
