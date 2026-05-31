import { eq, desc, sql } from "drizzle-orm";
import { withUserContext } from "@/lib/db";
import { offers, listings, profiles } from "@/lib/db/schema";
import { unstable_cache } from "next/cache";

export async function getOffersReceived(sellerId: string) {
  try {
    const data = await withUserContext(sellerId, async (tx) => {
      return await tx.select({
        id: offers.id,
        listingId: offers.listingId,
        buyerId: offers.buyerId,
        sellerId: offers.sellerId,
        currentAmountCents: offers.currentAmountCents,
        currentMessage: offers.currentMessage,
        state: offers.state,
        roundsUsed: offers.roundsUsed,
        lastActorId: offers.lastActorId,
        updatedAt: offers.updatedAt,
        listingTitle: listings.title,
        listingPriceCents: listings.priceCents,
        counterpartyHandle: profiles.handle,
        counterpartyName: profiles.displayName,
        counterpartyAvatar: profiles.profilePhotoUrl,
        listingThumbnail: sql<string>`COALESCE((SELECT storage_path FROM item_photos WHERE card_id = ${listings.cardId} ORDER BY sort_order ASC LIMIT 1), '')`,
      })
      .from(offers)
      .innerJoin(listings, eq(offers.listingId, listings.id))
      .innerJoin(profiles, eq(offers.buyerId, profiles.userId))
      .where(eq(offers.sellerId, sellerId))
      .orderBy(desc(offers.updatedAt));
    });
    return data;
  } catch (err) {
    console.error("Error fetching offers received:", err);
    return [];
  }
}

export async function getOffersMade(buyerId: string) {
  try {
    const data = await withUserContext(buyerId, async (tx) => {
      return await tx.select({
        id: offers.id,
        listingId: offers.listingId,
        buyerId: offers.buyerId,
        sellerId: offers.sellerId,
        currentAmountCents: offers.currentAmountCents,
        currentMessage: offers.currentMessage,
        state: offers.state,
        roundsUsed: offers.roundsUsed,
        lastActorId: offers.lastActorId,
        updatedAt: offers.updatedAt,
        listingTitle: listings.title,
        listingPriceCents: listings.priceCents,
        counterpartyHandle: profiles.handle,
        counterpartyName: profiles.displayName,
        counterpartyAvatar: profiles.profilePhotoUrl,
        listingThumbnail: sql<string>`COALESCE((SELECT storage_path FROM item_photos WHERE card_id = ${listings.cardId} ORDER BY sort_order ASC LIMIT 1), '')`,
      })
      .from(offers)
      .innerJoin(listings, eq(offers.listingId, listings.id))
      .innerJoin(profiles, eq(offers.sellerId, profiles.userId))
      .where(eq(offers.buyerId, buyerId))
      .orderBy(desc(offers.updatedAt));
    });
    return data;
  } catch (err) {
    console.error("Error fetching offers made:", err);
    return [];
  }
}
