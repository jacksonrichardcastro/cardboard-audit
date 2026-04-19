"use server";

import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, listings, users, sellers } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";

export async function getSellerInventory() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const data = await db.select({
      id: listings.id,
      title: listings.title,
      priceCents: listings.priceCents,
      category: listings.category,
      condition: listings.condition,
      createdAt: listings.createdAt,
    })
    .from(listings)
    .where(eq(listings.sellerId, userId))
    .orderBy(desc(listings.createdAt));

    return data;
  } catch (error) {
    console.error("Error fetching seller inventory:", error);
    return [];
  }
}

export async function getSellerOrders() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const data = await db.select({
      id: orders.id,
      totalCents: orders.totalCents,
      feeCents: orders.feeCents,
      shippingCents: orders.shippingCents,
      currentState: orders.currentState,
      createdAt: orders.createdAt,
      buyerName: users.fullName,
      buyerEmail: users.email,
      listingTitle: listings.title,
    })
    .from(orders)
    .innerJoin(listings, eq(orders.listingId, listings.id))
    .innerJoin(users, eq(orders.buyerId, users.userId))
    .where(eq(orders.sellerId, userId))
    .orderBy(desc(orders.createdAt));

    return data;
  } catch (error) {
    console.error("Error fetching seller fulfillment orders:", error);
    return [];
  }
}
