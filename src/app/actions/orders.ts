"use server";

import { eq, desc, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, stateTransitions, sellers, users, listings } from "@/lib/db/schema";
import { OrderState } from "@/components/shared/transparency-ledger";
import { auth } from "@clerk/nextjs/server";

export async function getOrderWithLedger(orderId: number) {
  try {
    const [orderData] = await db.select({
      id: orders.id,
      currentState: orders.currentState,
      priceCents: orders.priceCentsAtSale,
      shippingCents: orders.shippingCents,
      taxCents: orders.taxCents,
      sellerHandle: sellers.businessName,
      buyerEmail: users.email,
    })
    .from(orders)
    .innerJoin(sellers, eq(orders.sellerId, sellers.userId))
    .innerJoin(users, eq(orders.buyerId, users.id))
    .where(eq(orders.id, orderId))
    .limit(1);

    if (!orderData) return null;

    // Fetch timeline separately (Drizzle ORM explicit relation querying could also be used here via db.query)
    const transitions = await db.select({
      newState: stateTransitions.newState,
      createdAt: stateTransitions.createdAt,
      actorId: stateTransitions.actorId,
      trackingNumber: stateTransitions.trackingNumber,
    })
    .from(stateTransitions)
    .where(eq(stateTransitions.orderId, orderId))
    .orderBy(asc(stateTransitions.createdAt));

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

    const data = await db.select({
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

    return data;
  } catch (error) {
    console.error("Error fetching buyer orders:", error);
    return [];
  }
}
