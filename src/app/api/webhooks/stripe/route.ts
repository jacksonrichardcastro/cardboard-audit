import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db, withUserContext } from "@/lib/db";
import * as Sentry from "@sentry/nextjs";
import { orders, stateTransitions, listings, sellers, webhookEvents } from "@/lib/db/schema";
import { inArray, eq } from "drizzle-orm";
import { env } from "@/env";
import { stripe } from "@/lib/stripe";

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
          .update(sellers)
          .set({ identityVerified: true })
          .where(eq(sellers.userId, identityUserId));
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
  try {
    listingIds = JSON.parse(session.metadata?.listingIds ?? "[]");
  } catch {
    throw new Error(`Invalid listingIds metadata on session ${session.id}`);
  }
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
      sellerStripeId: sellers.stripeConnectAccountId,
      feeTier: sellers.feeTier,
    })
    .from(listings)
    .innerJoin(sellers, eq(listings.sellerId, sellers.userId))
    .where(inArray(listings.id, listingIds));

  if (dbItems.length !== listingIds.length) {
    throw new Error(
      `Listing count mismatch on session ${session.id}: requested ${listingIds.length}, found ${dbItems.length}`,
    );
  }

  // Create every order + its genesis state-transition in a single system-
  // scoped transaction so a failure rolls back partial state instead of
  // leaving some orders orphaned.
  await withUserContext("system", async (tx) => {
    for (const item of dbItems) {
      // Fee: founding tier 3%, standard tier 5%. Integer math only — cents in,
      // cents out. floor() avoids rounding up to the seller's detriment.
      const feeBps = item.feeTier === "founding" ? 300 : 500;
      const feeCents = Math.floor((item.priceCents * feeBps) / 10_000);

      const [newOrder] = await tx
        .insert(orders)
        .values({
          buyerId,
          sellerId: item.sellerId,
          listingId: item.id,
          currentState: "PAID",
          priceCentsAtSale: item.priceCents,
          taxCents: 0,
          shippingCents: 500,
          totalCents: item.priceCents + 500,
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
  });
}
