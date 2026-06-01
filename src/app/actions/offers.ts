"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { offers, listings, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function ensureUserExists(userId: string) {
  const user = await currentUser();
  if (!user) return;
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return;

  await db.insert(users)
    .values({
      id: userId,
      email: email,
      role: "buyer",
      accountType: "buyer"
    })
    .onConflictDoNothing();
}

export async function createOfferAction(listingId: number, amountCents: number, message?: string) {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Must be signed in to make an offer." };
  }

  await ensureUserExists(userId);

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

  if (listing.status !== "active" && listing.status !== "pending_marketplace_activation") {
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

export async function acceptOfferAction(offerId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Must be signed in." };
  await ensureUserExists(userId);

  const offer = await db.query.offers.findFirst({
    where: eq(offers.id, offerId),
  });

  if (!offer) return { error: "Offer not found." };

  if (offer.state !== "pending" && offer.state !== "countered") {
    return { error: "Offer is not in a state that can be accepted." };
  }

  // Ensure current user is part of the offer but NOT the last actor
  if ((offer.buyerId !== userId && offer.sellerId !== userId) || offer.lastActorId === userId) {
    return { error: "You cannot accept this offer." };
  }

  try {
    await db.update(offers)
      .set({ state: "accepted", updatedAt: new Date() })
      .where(eq(offers.id, offerId));
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to accept offer." };
  }
}

export async function declineOfferAction(offerId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Must be signed in." };
  await ensureUserExists(userId);

  const offer = await db.query.offers.findFirst({
    where: eq(offers.id, offerId),
  });

  if (!offer) return { error: "Offer not found." };

  if (offer.state !== "pending" && offer.state !== "countered") {
    return { error: "Offer is not in a state that can be declined." };
  }

  if ((offer.buyerId !== userId && offer.sellerId !== userId) || offer.lastActorId === userId) {
    return { error: "You cannot decline this offer." };
  }

  try {
    await db.update(offers)
      .set({ state: "declined", updatedAt: new Date() })
      .where(eq(offers.id, offerId));
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to decline offer." };
  }
}

export async function counterOfferAction(offerId: string, amountCents: number, message?: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Must be signed in." };
  await ensureUserExists(userId);

  if (!amountCents || amountCents <= 0) {
    return { error: "Counter amount must be greater than zero." };
  }

  if (message && message.length > 1000) {
    return { error: "Message cannot exceed 1000 characters." };
  }

  const offer = await db.query.offers.findFirst({
    where: eq(offers.id, offerId),
  });

  if (!offer) return { error: "Offer not found." };

  if (offer.state !== "pending" && offer.state !== "countered") {
    return { error: "Offer is not in a state that can be countered." };
  }

  if ((offer.buyerId !== userId && offer.sellerId !== userId) || offer.lastActorId === userId) {
    return { error: "You cannot counter this offer." };
  }

  if (offer.roundsUsed >= 3) {
    return { error: "Maximum number of rounds (3) reached." };
  }

  try {
    await db.update(offers)
      .set({
        currentAmountCents: amountCents,
        currentMessage: message || null,
        lastActorId: userId,
        roundsUsed: offer.roundsUsed + 1,
        state: "countered",
        updatedAt: new Date(),
      })
      .where(eq(offers.id, offerId));
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to counter offer." };
  }
}
