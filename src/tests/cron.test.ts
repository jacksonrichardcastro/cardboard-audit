import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { POST } from "@/app/api/cron/payout-sweeper/route";
import { eq } from "drizzle-orm";

vi.mock("stripe", () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            transfers: {
                create: vi.fn().mockResolvedValue({ id: "tr_mock123" })
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
