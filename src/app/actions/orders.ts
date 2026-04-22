"use server";

import { eq, desc, asc } from "drizzle-orm";
import { db, withUserContext } from "@/lib/db";
import { orders, stateTransitions, sellers, users, listings, payouts } from "@/lib/db/schema";
import { OrderState } from "@/components/shared/transparency-ledger";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { env } from "@/env";
import { calculateNetPayout } from "@/lib/payout-math";
import { processBuyerReceipt } from "@/lib/orders/confirm";

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

export async function confirmBuyerReceipt(orderId: number, triggerActor?: string) {
  const { userId } = await auth();
  
  if (!userId) throw new Error("Unauthorized");
  return processBuyerReceipt(orderId, { id: userId, role: "buyer" });
}

// P1-5: Seller State Execution boundaries
export async function updateOrderState(orderId: number, newState: string, trackingNumber?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const currentOrder = await withUserContext(userId, async (tx) => {
    const [record] = await tx.select({
      id: orders.id,
      currentState: orders.currentState,
      sellerId: orders.sellerId
    })
    .from(orders)
    .where(eq(orders.id, orderId)).limit(1);
    return record;
  });

  if (!currentOrder) throw new Error("Order not found");
  if (currentOrder.sellerId !== userId) throw new Error("Unauthorized restriction bounds");
  
  if (currentOrder.currentState !== "PAID" && Object.values(OrderStateLimits).indexOf(newState) > 0) {
     throw new Error("Invalid state progression tracking");
  }

  await withUserContext(userId, async (tx) => {
    await tx.update(orders).set({ currentState: newState }).where(eq(orders.id, orderId));
  
    await tx.insert(stateTransitions).values({
      orderId: orderId,
      newState: newState,
      previousState: currentOrder.currentState,
      actorId: userId,
      trackingNumber,
      notes: trackingNumber ? `Updated tracking metadata: ${trackingNumber}` : undefined
    });
  });

  return { success: true };
}
