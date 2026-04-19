import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, stateTransitions, sellers, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { sendOrderDeliveryNotification } from "@/lib/email";
import Stripe from "stripe";

// Requires STRIPE_SECRET_KEY to fire eventual payouts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: Request) {
  try {
    // 1. Signature check omitted for MVP (Shippo/EasyPost HMAC validation would go here)
    const payload = await req.json();
    
    // Example Carrier Payload expectation: { tracking_number: "1Z999", status: "delivered" }
    const trackingNo = payload?.tracking_number;
    const statusToken = payload?.status?.toUpperCase();

    if (!trackingNo || !statusToken) {
      return new NextResponse("Invalid Carrier Payload", { status: 400 });
    }

    // 2. Reverse tracking lookup to locate our internal Order record
    const [latestTransition] = await db.select()
      .from(stateTransitions)
      .where(eq(stateTransitions.trackingNumber, trackingNo))
      .orderBy(desc(stateTransitions.createdAt))
      .limit(1);

    if (!latestTransition) {
      console.warn(`Carrier hook ignored. Unknown tracking ID: ${trackingNo}`);
      return new NextResponse("Tracking constraint mismatch", { status: 200 }); // Return 200 so carrier doesn't retry infinitely
    }

    const orderId = latestTransition.orderId;

    // Normalize Carrier Strings into CardBound Standard Types
    let finalState = "IN_TRANSIT";
    if (statusToken === "DELIVERED" || statusToken === "COMPLETED") finalState = "DELIVERED";

    // 3. Immutability Sequence
    // Prevent duplicated states if carrier sends redundant pings
    const [currentOrder] = await db.select({
      id: orders.id,
      currentState: orders.currentState,
      sellerId: orders.sellerId,
      priceCentsAtSale: orders.priceCentsAtSale,
      feeCents: orders.feeCents,
      stripePaymentIntentId: orders.stripePaymentIntentId,
      buyerEmail: users.email
    })
    .from(orders)
    .innerJoin(users, eq(orders.buyerId, users.userId))
    .where(eq(orders.id, orderId)).limit(1);

    if (!currentOrder || currentOrder.currentState === finalState) {
        return new NextResponse("Sequence bypassed (already mapped)", { status: 200 });
    }

    // Insert new Node
    await db.insert(stateTransitions).values({
      orderId,
      newState: finalState,
      previousState: currentOrder.currentState,
      actorId: "carrier_api",
      trackingNumber: trackingNo,
      notes: `Automated carrier ping received: ${statusToken}`
    });

    await db.update(orders)
      .set({ currentState: finalState })
      .where(eq(orders.id, orderId));

    // 4. True Escrow Auto-Release Logic
    if (finalState === "DELIVERED") {
        // Find seller payout mechanics securely via Database parameters
        const [sellerRecord] = await db.select().from(sellers).where(eq(sellers.userId, currentOrder.sellerId)).limit(1);
        
        if (sellerRecord?.stripeConnectAccountId && process.env.STRIPE_SECRET_KEY) {
            // Re-calculate the specific net payout logic (Base value - 10% platform fee MVP)
            const netPayoutCents = currentOrder.priceCentsAtSale - currentOrder.feeCents;

            try {
                // Issue the dynamic cross-account ledger transfer!
                // Using the strict PaymentIntent to group it successfully
                await stripe.transfers.create({
                    amount: netPayoutCents,
                    currency: "usd",
                    destination: sellerRecord.stripeConnectAccountId,
                    transfer_group: currentOrder.stripePaymentIntentId || "guest_transfer", 
                });
                console.log(`[ESCROW CLEARED] Successfully triggered payout for Order ${orderId}`);
            } catch (err) {
                console.error("[CRITICAL STRIPE TRANSFER ERR]", err);
            }
        }
        
        // Push the active delivery email specifically to the Buyer so they know to check the door
        await sendOrderDeliveryNotification(currentOrder.buyerEmail, orderId, trackingNo);
    }

    return new NextResponse("Operation Success", { status: 200 });

  } catch (error) {
    console.error("[SHIPPING_WEBHOOK_ERROR]", error);
    return new NextResponse("Internal Framework Error", { status: 500 });
  }
}
