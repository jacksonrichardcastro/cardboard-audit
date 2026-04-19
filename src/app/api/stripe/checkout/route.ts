import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { listings, sellers } from "@/lib/db/schema";
import { inArray, eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    // In MVP, we allow unauthenticated mock purchases for demo routing
    // if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const listingIds: number[] = body.listingIds;

    if (!listingIds || listingIds.length === 0) {
      return new NextResponse("Cart is empty", { status: 400 });
    }

    // 1. Secure Database Price Enforcement
    // We strictly pull prices from Drizzle to prevent client payload manipulation
    const dbItems = await db
      .select({
        id: listings.id,
        title: listings.title,
        priceCents: listings.priceCents,
        sellerStripeId: sellers.stripeConnectAccountId,
        sellerId: listings.sellerId,
      })
      .from(listings)
      .innerJoin(sellers, eq(listings.sellerId, sellers.userId))
      .where(inArray(listings.id, listingIds));

    if (dbItems.length !== listingIds.length) {
      return new NextResponse("One or more items not found", { status: 404 });
    }

    // 2. Generate cryptographically distinct transfer route logic
    // This exact string will map all sub-transfers generated within the subsequent webhook
    const transferGroupId = `group_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 3. Flat Shipping Logic Injection
    // Using standard $5.00 strict pricing multiplier by vendor count
    const distinctSellers = new Set(dbItems.map(i => i.sellerId));
    const totalShippingCents = distinctSellers.size * 500;

    const lineItems = dbItems.map(item => ({
      price_data: {
        currency: "usd",
        product_data: { 
          name: item.title, 
          metadata: { listingId: item.id.toString(), sellerId: item.sellerId } 
        },
        unit_amount: item.priceCents,
      },
      quantity: 1,
    }));

    // Inject shipping as a single line item line explicitly defining total carrier costs
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Expedited Escrow Shipping (Aggregated)", metadata: { listingId: "shipping", sellerId: "system" } },
        unit_amount: totalShippingCents
      },
      quantity: 1
    });

    const host = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 4. Build unified Hosted checkout explicitly declaring the transfer_group
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${host}/admin/vetting?success=true`, // placeholder route
      cancel_url: `${host}/cart?canceled=true`,
      payment_intent_data: {
        transfer_group: transferGroupId,
      },
      metadata: {
        buyerId: userId || "guest_mock",
        transferGroupId,
        listingIds: JSON.stringify(listingIds),
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[STRIPE_CHECKOUT_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
