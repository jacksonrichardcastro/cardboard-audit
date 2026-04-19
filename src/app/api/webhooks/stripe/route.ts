import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { orders, stateTransitions, listings, sellers } from "@/lib/db/schema";
import { inArray, eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    // In local dev without webhook secrets, we fallback to trusting the raw JSON payload if test keys are mocked
    if (process.env.NODE_ENV !== "production" && !process.env.STRIPE_WEBHOOK_SECRET) {
      event = JSON.parse(body);
    } else {
      return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    // 1. Unpack Metadata Payload
    const listingIds: number[] = JSON.parse(session.metadata?.listingIds || "[]");
    const buyerId = session.metadata?.buyerId || "unknown";
    const transferGroupId = session.metadata?.transferGroupId;

    if (!listingIds.length || !transferGroupId) {
       return new NextResponse("Missing metadata", { status: 400 });
    }

    // 2. Hydrate constraints
    const dbItems = await db
      .select({
        id: listings.id,
        priceCents: listings.priceCents,
        sellerId: listings.sellerId,
        sellerStripeId: sellers.stripeConnectAccountId,
      })
      .from(listings)
      .innerJoin(sellers, eq(listings.sellerId, sellers.userId))
      .where(inArray(listings.id, listingIds));

    // 3. Ledger Automation Engine
    // Iterate securely executing each payload inside raw PostgreSQL
    for (const item of dbItems) {
      // Calculate Platform Fee (10% flat for MVP)
      const feeCents = Math.round(item.priceCents * 0.10);
      const sellerPayoutCents = item.priceCents - feeCents;

      // Create Order Instance natively
      const [newOrder] = await db.insert(orders).values({
        buyerId,
        sellerId: item.sellerId,
        listingId: item.id,
        currentState: "PAID",
        priceCentsAtSale: item.priceCents,
        taxCents: 0,
        shippingCents: 500, // Static offset per seller constraint
        totalCents: item.priceCents + 500,
        feeCents,
        stripePaymentIntentId: session.payment_intent as string,
      }).returning({ id: orders.id });

      // Automatically append the Genesis node to the immutable Transparency Ledger
      await db.insert(stateTransitions).values({
        orderId: newOrder.id,
        newState: "PAID",
        actorId: "system", // Stripe triggered automatically
        notes: "Funds locked into platform escrow.",
      });

      // 4. Operational Escrow Enforcement
      // We explicitly DO NOT trigger stripe.transfers.create here anymore.
      // Funds are legally locked in the Connected Platform account.
      // Payouts occur strictly inside `/api/webhooks/shipping` when the tracking APIs ping the DELIVERED status.
      // The `transfer_group` generated inside `session` safely tags the liquidity.
    }
  }

  return new NextResponse(null, { status: 200 });
}
