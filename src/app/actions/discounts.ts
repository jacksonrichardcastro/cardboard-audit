"use server";

import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function runDiscount(
  listingId: number,
  discountType: "percent" | "dollar" | null,
  discountAmount: number | null,
  discountActiveUntil: Date | null
) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Authorize: ensure the user is the owner of the listing
  const [listing] = await db
    .select({ sellerId: listings.sellerId })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);

  if (!listing || listing.sellerId !== userId) {
    throw new Error("Unauthorized: You do not own this listing");
  }

  // Write to DB
  await db
    .update(listings)
    .set({
      discountType,
      discountAmount,
      discountActiveUntil,
    })
    .where(eq(listings.id, listingId));

  revalidatePath("/");
  revalidatePath("/[handle]", "page");
  revalidatePath("/listings/[id]", "page");
  
  return { success: true };
}
