import { withUserContext } from "@/lib/db";
import { orders, stateTransitions, sellers, payouts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { calculateNetPayout } from "@/lib/payout-math";
import { env } from "@/env";
import Stripe from "stripe";

export async function processBuyerReceipt(orderId: number, actor: { id: string, role: string }) {
  const currentOrder = await withUserContext(actor.id, async (tx) => {
    const [record] = await tx.select({
      id: orders.id,
      currentState: orders.currentState,
      priceCentsAtSale: orders.priceCentsAtSale,
      shippingCents: orders.shippingCents,
      feeCents: orders.feeCents,
      stripePaymentIntentId: orders.stripePaymentIntentId,
      sellerId: orders.sellerId,
      buyerId: orders.buyerId,
    })
    .from(orders)
    .where(eq(orders.id, orderId)).limit(1);
    return record;
  });

  if (!currentOrder) throw new Error("Order not found");
  if (actor.role === "buyer" && currentOrder.buyerId !== actor.id) throw new Error("Unauthorized Buyer constraints");
  if (currentOrder.currentState !== "PENDING_BUYER_CONFIRM") throw new Error("Order cannot be confirmed right now");

  const sellerRecord = await withUserContext(actor.id, async (tx) => {
    const [record] = await tx.select().from(sellers).where(eq(sellers.userId, currentOrder.sellerId)).limit(1);
    return record;
  });
  if (!sellerRecord?.stripeConnectAccountId) throw new Error("Vendor Stripe Account Missing API Configuration");

  const netPayoutCents = calculateNetPayout(currentOrder.priceCentsAtSale, currentOrder.shippingCents, currentOrder.feeCents);
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any });
  
  await withUserContext(actor.id, async (tx) => {
    await tx.update(orders).set({ currentState: "BUYER_CONFIRMED" }).where(eq(orders.id, orderId));
    await tx.insert(stateTransitions).values({
      orderId,
      newState: "BUYER_CONFIRMED",
      previousState: currentOrder.currentState,
      actorId: actor.id,
      notes: actor.role === "buyer" ? "Manual Buyer Escrow Resolution" : "Autonomous 72H Escrow Completion",
    });
  });

  try {
     const transfer = await stripe.transfers.create({
        amount: netPayoutCents,
        currency: "usd",
        destination: sellerRecord.stripeConnectAccountId,
        transfer_group: currentOrder.stripePaymentIntentId || undefined,
     });

     await withUserContext(actor.id, async (tx) => {
       await tx.insert(payouts).values({
          orderId,
          sellerId: currentOrder.sellerId,
          stripeTransferId: transfer.id,
          grossCents: currentOrder.priceCentsAtSale,
          feeCents: currentOrder.feeCents,
          netCents: netPayoutCents,
       });
     });

     return { success: true };
  } catch (err) {
     console.error("[CRITICAL STRIPE ESCROW ERROR]", err);
     throw err;
  }
}
