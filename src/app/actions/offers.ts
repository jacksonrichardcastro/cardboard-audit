"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { offers, listings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function createOfferAction(listingId: number, amountCents: number, message?: string) {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Must be signed in to make an offer." };
  }

  if (!amountCents || amountCents <= 0) {
    return { error: "Offer amount must be greater than zero." };
  }

  if (message && message.length > 1000) {
    return { error: "Message cannot exceed 1000 characters." };
  }

  // Fetch the listing to ensure it exists and get sellerId
  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, listingId),
  });

  if (!listing) {
    return { error: "Listing not found." };
  }

  if (listing.status !== "ACTIVE") {
    return { error: "Listing is no longer active." };
  }

  if (listing.sellerId === userId) {
    return { error: "You cannot make an offer on your own listing." };
  }

  if (amountCents >= listing.priceCents) {
    return { error: "Offer amount must be less than the buy now price." };
  }

  try {
    await db.insert(offers).values({
      listingId,
      buyerId: userId,
      sellerId: listing.sellerId,
      currentAmountCents: amountCents,
      currentMessage: message || null,
      state: "pending",
      roundsUsed: 1,
      lastActorId: userId,
    });

    return { success: true };
  } catch (err: any) {
    console.error("Failed to create offer:", err);
    return { error: "Failed to create offer. Please try again." };
  }
}
