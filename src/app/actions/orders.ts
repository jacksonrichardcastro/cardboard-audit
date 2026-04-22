"use server";

import { eq, desc, asc } from "drizzle-orm";
import { withUserContext } from "@/lib/db";
import { orders, stateTransitions, sellers, users, listings } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { processBuyerReceipt } from "@/lib/orders/confirm";
import { canTransition, parseOrderState, type OrderState } from "@/lib/orders/state-machine";

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

/**
 * Seller-driven order state transition. The state machine in
 * @/lib/orders/state-machine is the single source of truth for which
 * transitions are legal for the seller actor. Anything outside that map
 * throws, including attempts by a non-seller user, unknown target states,
 * and any transition not explicitly enumerated for `actor: "seller"`.
 *
 * Update + state_transitions insert run inside a single withUserContext
 * transaction so a failed insert rolls back the order-row update.
 */
export async function updateOrderState(
  orderId: number,
  newState: OrderState,
  trackingNumber?: string,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const targetState = parseOrderState(newState);
  if (!targetState) {
    throw new Error(`Invalid target state: ${newState}`);
  }

  return await withUserContext(userId, async (tx) => {
    const [currentOrder] = await tx
      .select({
        id: orders.id,
        currentState: orders.currentState,
        sellerId: orders.sellerId,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!currentOrder) throw new Error("Order not found");
    if (currentOrder.sellerId !== userId) {
      throw new Error("Unauthorized: only the listing's seller may update this order");
    }

    const fromState = parseOrderState(currentOrder.currentState);
    if (!fromState) {
      throw new Error(`Order is in unknown state: ${currentOrder.currentState}`);
    }

    if (!canTransition(fromState, targetState, "seller")) {
      throw new Error(
        `Invalid seller transition: ${fromState} -> ${targetState}`,
      );
    }

    await tx
      .update(orders)
      .set({ currentState: targetState })
      .where(eq(orders.id, orderId));

    await tx.insert(stateTransitions).values({
      orderId,
      newState: targetState,
      previousState: fromState,
      actorId: userId,
      trackingNumber,
      notes: trackingNumber ? `Updated tracking metadata: ${trackingNumber}` : undefined,
    });

    return { success: true as const };
  });
}
