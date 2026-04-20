"use server";

import { eq, desc, asc } from "drizzle-orm";
import { db, withUserContext } from "@/lib/db";
import { orders, stateTransitions, sellers, users, listings, payouts } from "@/lib/db/schema";
import { OrderState } from "@/components/shared/transparency-ledger";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { env } from "@/env";
import { calculateNetPayout } from "@/lib/payout-math";

export async function getOrderWithLedger(orderId: number) {
  try {
    const { userId } = await auth();

    const orderData = await withUserContext(userId, async (tx) => {
      const [record] = await tx.select({
        id: orders.id,
        currentState: orders.currentState,
        priceCents: orders.priceCentsAtSale,
        shippingCents: orders.shippingCents,
        taxCents: orders.taxCents,
        sellerHandle: sellers.businessName,
        buyerEmail: users.email,
        buyerId: orders.buyerId,
        sellerId: orders.sellerId,
      })
      .from(orders)
      .innerJoin(sellers, eq(orders.sellerId, sellers.userId))
      .innerJoin(users, eq(orders.buyerId, users.id))
      .where(eq(orders.id, orderId))
      .limit(1);
      return record;
    });

    if (!orderData) return null;

    // Fetch timeline separately (Drizzle ORM explicit relation querying could also be used here via db.query)
    const transitions = await withUserContext(userId, async (tx) => {
      return await tx.select({
        newState: stateTransitions.newState,
        createdAt: stateTransitions.createdAt,
        actorId: stateTransitions.actorId,
        trackingNumber: stateTransitions.trackingNumber,
      })
      .from(stateTransitions)
      .where(eq(stateTransitions.orderId, orderId))
      .orderBy(asc(stateTransitions.createdAt));
    });

    return {
      ...orderData,
      currentState: orderData.currentState as OrderState,
      history: transitions.map(t => ({
        ...t,
        createdAt: t.createdAt.toISOString()
      }))
    };
  } catch (error) {
    console.error(`Error fetching order ledger ${orderId}:`, error);
    return null;
  }
}

export async function getBuyerOrders() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const data = await withUserContext(userId, async (tx) => {
      return await tx.select({
        id: orders.id,
        currentState: orders.currentState,
        totalCents: orders.totalCents,
        createdAt: orders.createdAt,
        listingTitle: listings.title,
        listingImage: listings.photos,
        sellerName: sellers.businessName,
      })
      .from(orders)
      .innerJoin(listings, eq(orders.listingId, listings.id))
      .innerJoin(sellers, eq(orders.sellerId, sellers.userId))
      .where(eq(orders.buyerId, userId))
      .orderBy(desc(orders.createdAt));
    });

    return data;
  } catch (error) {
    console.error("Error fetching buyer orders:", error);
    return [];
  }
}

export async function confirmBuyerReceipt(orderId: number, triggerActor: "buyer" | "system" = "buyer") {
  const { userId } = await auth();
  
  if (triggerActor === "buyer" && !userId) throw new Error("Unauthorized");

  const currentOrder = await withUserContext(userId || "system", async (tx) => {
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
  if (triggerActor === "buyer" && currentOrder.buyerId !== userId) throw new Error("Unauthorized Buyer constraints");
  if (currentOrder.currentState !== "PENDING_BUYER_CONFIRM") throw new Error("Order cannot be confirmed right now");

  const sellerRecord = await withUserContext(userId || "system", async (tx) => {
    const [record] = await tx.select().from(sellers).where(eq(sellers.userId, currentOrder.sellerId)).limit(1);
    return record;
  });
  if (!sellerRecord?.stripeConnectAccountId) throw new Error("Vendor Stripe Account Missing API Configuration");

  // P0-8: Enforce mathematical strict calculation logic
  const netPayoutCents = calculateNetPayout(currentOrder.priceCentsAtSale, currentOrder.shippingCents, currentOrder.feeCents);

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any });
  
  // Transition DB prior to external Stripe Request definitively mapping immutability
  await withUserContext(userId || "system", async (tx) => {
    await tx.update(orders).set({ currentState: "BUYER_CONFIRMED" }).where(eq(orders.id, orderId));
    await tx.insert(stateTransitions).values({
      orderId,
      newState: "BUYER_CONFIRMED",
      previousState: currentOrder.currentState,
      actorId: triggerActor === "buyer" ? userId! : "system",
      notes: triggerActor === "buyer" ? "Manual Buyer Escrow Resolution" : "Autonomous 72H Escrow Completion",
    });
  });

  try {
     // Final Execute Math routing the Seller's payout explicitly
     const transfer = await stripe.transfers.create({
        amount: netPayoutCents,
        currency: "usd",
        destination: sellerRecord.stripeConnectAccountId,
        transfer_group: currentOrder.stripePaymentIntentId || undefined,
     });

     // P1-8: Immutable Payout Ledger protecting Seller transfer traces natively
     await withUserContext(userId || "system", async (tx) => {
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

// P1-5: Seller State Execution boundaries
export async function updateOrderState(orderId: number, newState: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [currentOrder] = await db.select({
    id: orders.id,
    currentState: orders.currentState,
    sellerId: orders.sellerId,
  })
  .from(orders)
  .where(eq(orders.id, orderId)).limit(1);

  if (!currentOrder || currentOrder.sellerId !== userId) {
    throw new Error("Unauthorized to mutate this order");
  }

  // Restrict to explicitly allowed seller transitions mapping Escrow invariants
  const allowedTransitions = ["PACKAGED", "SHIPPED"];
  if (!allowedTransitions.includes(newState)) {
    throw new Error("Sellers cannot force this explicit transition boundary.");
  }

  await db.update(orders).set({ currentState: newState }).where(eq(orders.id, orderId));
  
  await db.insert(stateTransitions).values({
    orderId,
    newState,
    previousState: currentOrder.currentState,
    actorId: userId,
    notes: `Vendor manually verified status: ${newState}`,
  });

  return { success: true };
}
