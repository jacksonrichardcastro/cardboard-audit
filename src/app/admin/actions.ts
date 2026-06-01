"use server";

import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function activateListing(listingId: number) {
  await db
    .update(listings)
    .set({ status: "active" })
    .where(and(eq(listings.id, listingId), eq(listings.isDemo, false)));
    
  revalidatePath("/admin");
}

export async function activateAllListings() {
  await db
    .update(listings)
    .set({ status: "active" })
    .where(and(eq(listings.status, "pending_marketplace_activation"), eq(listings.isDemo, false)));
    
  revalidatePath("/admin");
}
