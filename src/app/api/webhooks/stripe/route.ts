import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db, withUserContext } from "@/lib/db";
import * as Sentry from "@sentry/nextjs";
import { orders, stateTransitions, listings, profiles, webhookEvents } from "@/lib/db/schema";
import { inArray, eq } from "drizzle-orm";
import { env } from "@/env";
import { stripe } from "@/lib/stripe";
import {
  rateLimit,
  identifierFromRequest,
  tooManyRequests,
} from "@/lib/rate-limit";

/**
 * Stripe webhook receiver.
 *
 * Idempotency contract: every delivery attempt for a given event.id must
 * produce exactly one set of side-effects. We enforce this by inserting
 * the event id into webhook_events with ON CONFLICT DO NOTHING and
 * checking the returning[] array — if it's empty, another worker already
 * claimed this event and we no-op with 200 so Stripe stops retrying.
 *
 * (The previous implementation wrapped onConflictDoNothing in try/catch
 * expecting the catch to fire on duplicate. It never fires: that method
 * does not throw on conflict, it silently returns no rows. Duplicate
 * events were being processed twice — a potential double-order bug.)
 */
export async function POST(req: Request) {
  // Pre-signature anti-flood. Stripe's own production IP pool is narrow
  // and well-behaved, but this endpoint is publicly reachable and spoofed
  // unsigned payloads still cost us a constructEvent+HMAC compare. 200/sec
  // per source IP is well above Stripe's real delivery rate.
  const rl = await rateLimit(`webhook:stripe:${identifierFromRequest(req)}`, {
    limit: 200,
    windowSec: 1,
  });
  if (!rl.ok) return tooManyRequests(rl);

  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error: any) {
    // Dev-only escape hatch: if NODE_ENV is explicitly "development" AND no
    // webhook secret is configured, accept the raw body. We intentionally do
    // NOT fall through in test/staging/preview — env misconfiguration there
    // must surface as a 400, not a silent trust-all.
    if (process.env.NODE_ENV === "development" && !process.env.STRIPE_WEBHOOK_SECRET) {
      console.warn("[stripe-webhook] dev-only: accepting unsigned payload (NODE_ENV=development)");
      try {
        event = JSON.parse(body) as Stripe.Event;
      } catch {
        return new NextResponse("Invalid JSON body", { status: 400 });
      }
    } else {
      Sentry.captureException(
        new Error(`Stripe webhook signature verification failed: ${error.message}`),
      );
      return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }
  }

  // Idempotency lock: claim this event id or bail.
  const claimed = await db
    .insert(webhookEvents)
    .values({
      id: event.id,
      source: "stripe",
      eventType: event.type,
      payloadJson: event as any,
    })
    .onConflictDoNothing()
    .returning({ id: webhookEvents.id });

  if (claimed.length === 0) {
    return NextResponse.json({ status: "duplicate_ignored", eventId: event.id });
  }

  try {
    if (event.type === "identity.verification_session.verified") {
      const sessionPayload = event.data.object as Stripe.Identity.VerificationSession;
      const identityUserId = sessionPayload.metadata?.userId;
      if (identityUserId) {
        await db
          .update(profiles)
          .set({ identityVerified: true })
          .where(eq(profiles.userId, identityUserId));
      }
      return new NextResponse(null, { status: 200 });
    }

    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      let newStatus = "pending";
      if (account.details_submitted && account.charges_enabled) {
        newStatus = "verified";
      } else if (account.details_submitted) {
        newStatus = "incomplete"; // Needs more info
      }
      
      await db
        .update(profiles)
        .set({ kycStatus: newStatus })
        .where(eq(profiles.stripeConnectAccountId, account.id));
      
      return new NextResponse(null, { status: 200 });
    }

    if (event.type === "account.application.deauthorized") {
      const application = event.data.object as Stripe.Application;
      // In connect webhooks, the account ID is in event.account
      const accountId = event.account;
      if (accountId) {
        await db
          .update(profiles)
          .set({ kycStatus: "incomplete" })
          .where(eq(profiles.stripeConnectAccountId, accountId));
      }
      return new NextResponse(null, { status: 200 });
    }

    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event);
      return new NextResponse(null, { status: 200 });
    }

    // Unhandled event type — we've claimed the idempotency row so Stripe
    // won't retry, but there's nothing to do.
    return new NextResponse(null, { status: 200 });
  } catch (err) {
    // Release the idempotency claim so Stripe can retry.
    await db.delete(webhookEvents).where(eq(webhookEvents.id, event.id));
    Sentry.captureException(err, { extra: { eventId: event.id, eventType: event.type } });
    return new NextResponse("Internal error — event released for retry", { status: 500 });
  }
}

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  let listingIds: number[];
  let orderItems: { id: number, quantity: number }[] = [];
  try {
    listingIds = JSON.parse(session.metadata?.listingIds ?? "[]");
    if (session.metadata?.orderItems) {
      const parsed = JSON.parse(session.metadata.orderItems);
      orderItems = parsed.map((p: any[]) => ({ id: p[0], quantity: p[1] }));
    } else {
      orderItems = listingIds.map(id => ({ id, quantity: 1 }));
    }
  } catch {
    throw new Error(`Invalid listingIds/orderItems metadata on session ${session.id}`);
  }
  const quantityMap = new Map(orderItems.map(i => [i.id, i.quantity]));
  const buyerId = session.metadata?.buyerId;
  const transferGroupId = session.metadata?.transferGroupId;

  if (!listingIds.length || !buyerId || !transferGroupId) {
    throw new Error(
      `Missing required metadata on session ${session.id}: listingIds=${!!listingIds.length} buyerId=${!!buyerId} transferGroupId=${!!transferGroupId}`,
    );
  }

  const dbItems = await db
    .select({
      id: listings.id,
      priceCents: listings.priceCents,
      sellerId: listings.sellerId,
      sellerStripeId: profiles.stripeConnectAccountId,
      feeTier: profiles.feeTier,
      quantity: listings.quantity,
    })
    .from(listings)
    .innerJoin(profiles, eq(listings.sellerId, profiles.userId))
    .where(inArray(listings.id, listingIds));

  if (dbItems.length !== listingIds.length) {
    throw new Error(
      `Listing count mismatch on session ${session.id}: requested ${listingIds.length}, found ${dbItems.length}`,
    );
  }

  await withUserContext("system", async (tx) => {
    const sellerShippingCharged = new Set<string>();

    for (const item of dbItems) {
      const purchasedQuantity = quantityMap.get(item.id) || 1;
      const newQuantity = Math.max(0, (item.quantity as number) - purchasedQuantity);

      await tx.update(listings)
        .set({ 
          quantity: newQuantity,
          status: newQuantity === 0 ? 'sold' : 'active'
        })
        .where(eq(listings.id, item.id));

      for (let i = 0; i < purchasedQuantity; i++) {
        // Fee: founding tier 3%, standard tier 5%. Integer math only — cents in,
        // cents out. floor() avoids rounding up to the seller's detriment.
        const feeBps = item.feeTier === "founding" ? 300 : 500;
        const feeCents = Math.floor(((item.priceCents as number) * feeBps) / 10_000);

        let shippingCents = 0;
        if (!sellerShippingCharged.has(item.sellerId)) {
          shippingCents = 500;
          sellerShippingCharged.add(item.sellerId);
        }

        const [newOrder] = await tx
          .insert(orders)
          .values({
            buyerId,
            sellerId: item.sellerId,
            listingId: item.id,
            currentState: "PAID",
            priceCentsAtSale: item.priceCents,
            taxCents: 0,
            shippingCents,
            totalCents: (item.priceCents as number) + shippingCents,
            feeCents,
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id ?? null,
            transferGroupId,
          })
          .returning({ id: orders.id });

        await tx.insert(stateTransitions).values({
          orderId: newOrder.id,
          newState: "PAID",
          actorId: "system",
          notes: "Checkout completed — funds held in platform escrow.",
        });
      }
    }
  });
}
