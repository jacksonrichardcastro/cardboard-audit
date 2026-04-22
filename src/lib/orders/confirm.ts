import { withUserContext } from "@/lib/db";
import { orders, stateTransitions, sellers, payouts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { calculateNetPayout } from "@/lib/payout-math";
import { stripe } from "@/lib/stripe";
import * as Sentry from "@sentry/nextjs";
import {
  canTransition,
  parseOrderState,
  type Actor,
  type OrderState,
} from "@/lib/orders/state-machine";

/**
 * Release an order's escrowed funds to the seller's Stripe Connect account
 * and mark the order BUYER_CONFIRMED.
 *
 * Ordering is deliberate: we fire stripe.transfers.create FIRST, then write
 * the state transition + payouts row inside a single DB transaction keyed
 * on the returned transfer.id. The previous implementation updated the
 * order row to BUYER_CONFIRMED before the transfer call and then inserted
 * the payouts row in a separate block — if the transfer failed, the DB
 * claimed success with no payout record, and a retry was impossible
 * because the state check below now rejects the order.
 *
 * Transfer failure: we log to Sentry with the orderId and rethrow so the
 * caller (buyer Server Action or cron sweeper) sees the error. The order
 * state stays at PENDING_BUYER_CONFIRM, making the retry trivially safe.
 */
export async function processBuyerReceipt(
  orderId: number,
  actor: { id: string; role: Actor },
) {
  const snapshot = await withUserContext(actor.id, async (tx) => {
    const [order] = await tx
      .select({
        id: orders.id,
        currentState: orders.currentState,
        priceCentsAtSale: orders.priceCentsAtSale,
        shippingCents: orders.shippingCents,
        feeCents: orders.feeCents,
        stripePaymentIntentId: orders.stripePaymentIntentId,
        transferGroupId: orders.transferGroupId,
        sellerId: orders.sellerId,
        buyerId: orders.buyerId,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) return null;

    const [sellerRecord] = await tx
      .select({
        stripeConnectAccountId: sellers.stripeConnectAccountId,
      })
      .from(sellers)
      .where(eq(sellers.userId, order.sellerId))
      .limit(1);

    return { order, sellerRecord };
  });

  if (!snapshot?.order) throw new Error("Order not found");

  const { order, sellerRecord } = snapshot;

  // Authorization: only the buyer themselves (or system/admin) can release.
  if (actor.role === "buyer" && order.buyerId !== actor.id) {
    throw new Error("Unauthorized: not the buyer for this order");
  }

  const fromState = parseOrderState(order.currentState);
  if (!fromState) {
    throw new Error(`Order ${orderId} is in unknown state: ${order.currentState}`);
  }
  if (!canTransition(fromState, "BUYER_CONFIRMED", actor.role)) {
    throw new Error(
      `Order cannot be confirmed from state ${fromState} by ${actor.role}`,
    );
  }

  if (!sellerRecord?.stripeConnectAccountId) {
    throw new Error(
      `Seller ${order.sellerId} has no Stripe Connect account — payout blocked`,
    );
  }

  const netPayoutCents = calculateNetPayout(
    order.priceCentsAtSale,
    order.shippingCents,
    order.feeCents,
  );

  // Fire the transfer BEFORE we touch order state. If this throws, the
  // order stays at PENDING_BUYER_CONFIRM and the caller can retry.
  let transfer: Awaited<ReturnType<typeof stripe.transfers.create>>;
  try {
    transfer = await stripe.transfers.create(
      {
        amount: netPayoutCents,
        currency: "usd",
        destination: sellerRecord.stripeConnectAccountId,
        // Reuse the transfer_group set at checkout so the transfer
        // reconciles back to the originating PaymentIntent. Fall back to
        // the payment intent id only if an older pre-0010 order row is
        // missing the group entirely.
        transfer_group: order.transferGroupId ?? order.stripePaymentIntentId ?? undefined,
        description: `Order #${order.id} payout`,
        metadata: {
          orderId: String(order.id),
          sellerId: order.sellerId,
          priceCents: String(order.priceCentsAtSale),
          feeCents: String(order.feeCents),
        },
      },
      {
        // Idempotency key: Stripe dedupes retries keyed on this string
        // within 24h. Pairing it to the order id means we can safely
        // retry processBuyerReceipt for the same order without
        // double-paying even if the DB write fails mid-flight.
        idempotencyKey: `order-${order.id}-payout`,
      },
    );
  } catch (transferError) {
    Sentry.captureException(transferError, {
      tags: { where: "stripe_transfers_create" },
      extra: {
        orderId: order.id,
        sellerId: order.sellerId,
        netPayoutCents,
        transferGroupId: order.transferGroupId,
      },
    });
    throw transferError;
  }

  // Transfer succeeded. Flip the order state + record the payout in a
  // single transaction so we don't end up with a transfer that isn't
  // reflected in our ledger.
  await withUserContext(actor.id, async (tx) => {
    await tx
      .update(orders)
      .set({ currentState: "BUYER_CONFIRMED" })
      .where(eq(orders.id, orderId));

    await tx.insert(stateTransitions).values({
      orderId,
      newState: "BUYER_CONFIRMED",
      previousState: fromState,
      actorId: actor.id,
      notes:
        actor.role === "buyer"
          ? "Buyer confirmed receipt; escrow released."
          : actor.role === "system"
            ? "Auto-confirmed after 72h hold; escrow released."
            : "Admin-triggered confirmation.",
    });

    await tx.insert(payouts).values({
      orderId,
      sellerId: order.sellerId,
      stripeTransferId: transfer.id,
      grossCents: order.priceCentsAtSale,
      feeCents: order.feeCents,
      netCents: netPayoutCents,
    });
  });

  return { success: true as const, transferId: transfer.id, netPayoutCents };
}
