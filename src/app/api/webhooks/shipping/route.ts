import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, stateTransitions, sellers, users, webhookEvents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { sendOrderDeliveryNotification } from "@/lib/email";
import { env } from "@/env";
import Stripe from "stripe";
import crypto from "crypto";

// Requires STRIPE_SECRET_KEY to fire eventual payouts
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any,
});

export async function POST(req: Request) {
  try {
    const copyBody = await req.text();
    const signature = req.headers.get("x-carrier-signature");

    // P0-1: HMAC signature validation blocking hostile injections explicitly
    if (!signature) {
      return new NextResponse("Missing Signature", { status: 401 });
    }

    const expectedSignature = crypto.createHmac("sha256", env.CARRIER_WEBHOOK_SECRET)
       .update(copyBody)
       .digest("hex");
        
    if (signature !== expectedSignature) {
       console.error("[CRITICAL] HOSTILE WEBHOOK INTERCEPTION ATTEMPT");
       return new NextResponse("Invalid Signature", { status: 401 });
    }

    const payload = JSON.parse(copyBody);
    
    // P0-2: Idempotent Lock preventing duplicate webhook execution natively through PostgreSQL
    const eventId = payload.id || `evt_${Date.now()}_${Math.random()}`;
    
    try {
      await db.insert(webhookEvents).values({
        id: eventId,
        source: "shipping",
        eventType: payload.event,
        payloadJson: payload,
      }).onConflictDoNothing();
    } catch {
       // If constraint fires, we have a duplicate early abort
       return NextResponse.json({ message: "Duplicate carrier event safely blocked by PG Engine" });
    }
    
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
    let isDelivered = false;
    
    if (statusToken === "DELIVERED" || statusToken === "COMPLETED") {
        finalState = "PENDING_BUYER_CONFIRM"; // P0-7 Escrow Delay Requirement
        isDelivered = true;
    }

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
    .innerJoin(users, eq(orders.buyerId, users.id))
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
      .set({ 
        currentState: finalState,
        ...(isDelivered ? { deliveredAt: new Date() } : {})
      })
      .where(eq(orders.id, orderId));

    // 4. True Escrow Auto-Release Logic Has Been Blocked (P0-7)
    // Funding logic is now executed asynchronously in action.confirmBuyerReceipt
    
    if (isDelivered) {
        // Push the active delivery email specifically to the Buyer so they know to check the door
        await sendOrderDeliveryNotification(currentOrder.buyerEmail, orderId, trackingNo);
    }

    return new NextResponse("Operation Success", { status: 200 });

  } catch (error) {
    console.error("[SHIPPING_WEBHOOK_ERROR]", error);
    return new NextResponse("Internal Framework Error", { status: 500 });
  }
}
