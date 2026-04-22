import { NextResponse } from "next/server";
import { db, withUserContext } from "@/lib/db";
import { orders, stateTransitions, users, webhookEvents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { sendOrderDeliveryNotification } from "@/lib/email";
import { env } from "@/env";
import * as Sentry from "@sentry/nextjs";
import crypto from "crypto";
import { canTransition, parseOrderState, type OrderState } from "@/lib/orders/state-machine";

/**
 * Shippo webhook receiver.
 *
 * Payload shape (Shippo track_updated event):
 *   {
 *     event: "track_updated",
 *     data: {
 *       tracking_number: "...",
 *       carrier: "ups" | "usps" | "fedex" | ...,
 *       tracking_status: {
 *         status: "PRE_TRANSIT" | "TRANSIT" | "DELIVERED" | "RETURNED" | "FAILURE" | "UNKNOWN",
 *         status_details: "...",
 *         status_date: "ISO8601",
 *       },
 *       ...
 *     }
 *   }
 *
 * Signature: Shippo signs the raw body with HMAC-SHA256 keyed on the
 * webhook secret configured in the Shippo dashboard, and delivers the hex
 * digest in the X-Shippo-Signature header. We mirror that contract here
 * using CARRIER_WEBHOOK_SECRET.
 *
 * Idempotency: Shippo may retry on 5xx. We claim each event by its id via
 * ON CONFLICT DO NOTHING + RETURNING — if the claim comes back empty,
 * another worker already processed it and we 200 without re-applying
 * side-effects.
 *
 * Previous implementation caveats addressed here:
 * - HMAC compare now uses crypto.timingSafeEqual (was `!==`, leaking).
 * - Idempotency now checks the returning[] (was try/catch around
 *   onConflictDoNothing, which never throws — so duplicates were
 *   processed twice).
 * - Payload shape now matches Shippo (was a generic
 *   {tracking_number, status} shape that no real carrier sends).
 * - State transition + order.currentState update run in a single
 *   withUserContext transaction so failure rolls back both.
 */

type ShippoTrackingStatus =
  | "PRE_TRANSIT"
  | "TRANSIT"
  | "DELIVERED"
  | "RETURNED"
  | "FAILURE"
  | "UNKNOWN";

interface ShippoWebhookPayload {
  event?: string;
  test?: boolean;
  data?: {
    object_id?: string;
    tracking_number?: string;
    carrier?: string;
    tracking_status?: {
      status?: ShippoTrackingStatus;
      status_details?: string;
      status_date?: string;
    };
  };
}

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const expected = crypto
    .createHmac("sha256", env.CARRIER_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  const providedBuf = Buffer.from(signatureHeader, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

/**
 * Map a Shippo tracking_status.status into our OrderState forward
 * transition. Returns the target state, or null if this status should
 * not drive a transition (ambiguous or not-yet-handled).
 */
function mapShippoStatus(
  status: ShippoTrackingStatus | undefined,
): { to: OrderState; isDelivery: boolean } | null {
  switch (status) {
    case "PRE_TRANSIT":
    case "TRANSIT":
      return { to: "IN_TRANSIT", isDelivery: false };
    case "DELIVERED":
      return { to: "PENDING_BUYER_CONFIRM", isDelivery: true };
    // RETURNED and FAILURE need product decisions (dispute? refund?) —
    // log and no-op until we have a spec for them.
    case "RETURNED":
    case "FAILURE":
    case "UNKNOWN":
    default:
      return null;
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  // Shippo delivers the signature in X-Shippo-Signature. We also accept the
  // legacy X-Carrier-Signature header during the migration window.
  const signature =
    req.headers.get("x-shippo-signature") ?? req.headers.get("x-carrier-signature");

  if (!verifySignature(rawBody, signature)) {
    Sentry.captureMessage("Shipping webhook: invalid or missing signature", {
      level: "warning",
    });
    return new NextResponse("Invalid Signature", { status: 401 });
  }

  let payload: ShippoWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Invalid JSON body", { status: 400 });
  }

  // Only process track_updated events. Other event types (e.g.
  // transaction_updated) ack with 200 so Shippo doesn't retry.
  if (payload.event !== "track_updated") {
    return NextResponse.json({ status: "ignored", event: payload.event ?? null });
  }

  const trackingNo = payload.data?.tracking_number;
  const shippoStatus = payload.data?.tracking_status?.status;
  const statusDetails = payload.data?.tracking_status?.status_details;

  if (!trackingNo || !shippoStatus) {
    return new NextResponse("Malformed Shippo payload", { status: 400 });
  }

  // Idempotency lock: use Shippo's object_id (stable per tracking update) if
  // provided; otherwise synthesize a key that's deterministic per
  // (tracking_no, status, status_date) so replays of the same event are
  // deduped but distinct status changes are not.
  const eventId =
    payload.data?.object_id ??
    `shippo_${trackingNo}_${shippoStatus}_${payload.data?.tracking_status?.status_date ?? ""}`;

  const claimed = await db
    .insert(webhookEvents)
    .values({
      id: eventId,
      source: "shipping",
      eventType: payload.event,
      payloadJson: payload as any,
    })
    .onConflictDoNothing()
    .returning({ id: webhookEvents.id });

  if (claimed.length === 0) {
    return NextResponse.json({ status: "duplicate_ignored", eventId });
  }

  try {
    const transition = mapShippoStatus(shippoStatus);
    if (!transition) {
      // Status we don't drive state from (RETURNED/FAILURE/UNKNOWN).
      // We still keep the idempotency row so we don't reprocess.
      return NextResponse.json({
        status: "noop_for_status",
        shippoStatus,
        details: statusDetails,
      });
    }

    // Reverse-lookup: the seller set the tracking number on a previous
    // state_transition (the SHIPPED row). The tracking_idx index on that
    // column keeps this cheap.
    const [latestTransition] = await db
      .select({ orderId: stateTransitions.orderId })
      .from(stateTransitions)
      .where(eq(stateTransitions.trackingNumber, trackingNo))
      .orderBy(desc(stateTransitions.createdAt))
      .limit(1);

    if (!latestTransition) {
      // Unknown tracking number. Either we never heard about this shipment,
      // or the seller forgot to upload the tracking. Ack with 200 so Shippo
      // doesn't hammer us, but capture for investigation.
      Sentry.captureMessage("Shippo webhook: unknown tracking number", {
        level: "warning",
        extra: { trackingNo, shippoStatus },
      });
      return NextResponse.json({ status: "unknown_tracking", trackingNo });
    }

    const orderId = latestTransition.orderId;
    let notifyBuyerEmail: string | null = null;

    await withUserContext("system", async (tx) => {
      const [currentOrder] = await tx
        .select({
          id: orders.id,
          currentState: orders.currentState,
          buyerEmail: users.email,
        })
        .from(orders)
        .innerJoin(users, eq(orders.buyerId, users.id))
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!currentOrder) {
        throw new Error(`Tracking pointed at nonexistent order ${orderId}`);
      }

      const fromState = parseOrderState(currentOrder.currentState);
      if (!fromState) {
        throw new Error(
          `Order ${orderId} is in unknown state: ${currentOrder.currentState}`,
        );
      }

      // Same-state ping (carrier re-sends TRANSIT while we're already
      // IN_TRANSIT) is a no-op, not an error.
      if (fromState === transition.to) {
        return;
      }

      if (!canTransition(fromState, transition.to, "system")) {
        // e.g. carrier reports DELIVERED when we're already BUYER_CONFIRMED
        // or DISPUTED. Log but don't 5xx; we've already claimed the
        // idempotency row.
        Sentry.captureMessage("Shippo webhook: rejected transition", {
          level: "warning",
          extra: {
            orderId,
            fromState,
            toState: transition.to,
            shippoStatus,
          },
        });
        return;
      }

      await tx.insert(stateTransitions).values({
        orderId,
        newState: transition.to,
        previousState: fromState,
        actorId: "system",
        trackingNumber: trackingNo,
        carrier: payload.data?.carrier,
        notes: `Shippo ${shippoStatus}${statusDetails ? `: ${statusDetails}` : ""}`,
      });

      await tx
        .update(orders)
        .set({
          currentState: transition.to,
          ...(transition.isDelivery ? { deliveredAt: new Date() } : {}),
        })
        .where(eq(orders.id, orderId));

      if (transition.isDelivery) {
        notifyBuyerEmail = currentOrder.buyerEmail;
      }
    });

    // Fire the delivery email outside the transaction so an email-service
    // hiccup doesn't revert the state change. Failures are captured but
    // don't 5xx.
    if (notifyBuyerEmail) {
      try {
        await sendOrderDeliveryNotification(notifyBuyerEmail, orderId, trackingNo);
      } catch (emailErr) {
        Sentry.captureException(emailErr, {
          extra: { orderId, trackingNo, where: "delivery_notification" },
        });
      }
    }

    return NextResponse.json({ status: "applied", orderId, to: transition.to });
  } catch (err) {
    // Release the idempotency claim so Shippo can retry.
    await db.delete(webhookEvents).where(eq(webhookEvents.id, eventId));
    Sentry.captureException(err, {
      extra: { eventId, trackingNo, shippoStatus, where: "shipping_webhook" },
    });
    return new NextResponse("Internal error — event released for retry", {
      status: 500,
    });
  }
}
