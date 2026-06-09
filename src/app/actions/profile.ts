"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles, listings, cards, storefronts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function setGrailCard(cardId: number) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Verify the seller actually owns this listing
  const card = await db.query.cards.findFirst({
    where: and(
      eq(cards.id, cardId),
      eq(cards.ownerId, userId)
    ),
  });

  if (!card) {
    throw new Error("Card not found or you don't have permission to set it as a grail.");
  }

  // Update the seller's grail
  await db
    .update(profiles)
    .set({ grailCardId: cardId })
    .where(eq(profiles.userId, userId));

  // Try to find the seller's handle to revalidate their profile page
  const [profile] = await db.select({ handle: profiles.handle }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (profile?.handle) {
    revalidatePath(`/${profile.handle}`);
  }

  return { success: true };
}

export async function updateHeaderCustomization(cardIds: number[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  if (cardIds.length > 8) {
    throw new Error("You can only feature up to 8 cards.");
  }

  await db
    .update(profiles)
    .set({ headerCustomizationIds: cardIds })
    .where(eq(profiles.userId, userId));

  const [profile] = await db.select({ handle: profiles.handle }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (profile?.handle) {
    revalidatePath(`/${profile.handle}`);
  }
  return { success: true };
}

export async function updateSellerProfile(data: { bio?: string | null; locationCity?: string | null; locationState?: string | null; profilePhotoUrl?: string | null; headerStyle?: string | null; bannerImageUrl?: string | null; presenceStatus?: string | null; displayName?: string | null; storefrontId?: string }) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  await db
    .update(profiles)
    .set({
      locationCity: data.locationCity || undefined,
      locationState: data.locationState || undefined,
      headerStyle: data.headerStyle || undefined,
      bannerImageUrl: data.bannerImageUrl || undefined,
      presenceStatus: data.presenceStatus || undefined,
    })
    .where(eq(profiles.userId, userId));

  if (data.storefrontId) {
    const { storefronts } = await import("@/lib/db/schema");
    await db.update(storefronts)
      .set({
        displayName: data.displayName || null,
        bio: data.bio || null,
        avatarUrl: data.profilePhotoUrl || null,
      })
      .where(and(eq(storefronts.id, data.storefrontId), eq(storefronts.userId, userId)));
  }

  const [seller] = await db.select({ handle: profiles.handle }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (seller?.handle) {
    revalidatePath(`/${seller.handle}`);
  }
  revalidatePath("/edit-profile");
  revalidatePath("/seller/dashboard");

  return { success: true };
}

export async function updatePresenceStatus(status: "online" | "away" | "offline") {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  await db
    .update(profiles)
    .set({ presenceStatus: status })
    .where(eq(profiles.userId, userId));

  const [seller] = await db.select({ handle: profiles.handle }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (seller?.handle) {
    revalidatePath(`/${seller.handle}`);
  }

  return { success: true };
}

export async function removeProfilePhoto() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Server-side auth check: implicitly enforced by eq(profiles.userId, userId)
  await db
    .update(profiles)
    .set({ profilePhotoUrl: null })
    .where(eq(profiles.userId, userId));

  const [seller] = await db.select({ handle: profiles.handle }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (seller?.handle) {
    revalidatePath(`/${seller.handle}`);
  }
  revalidatePath("/edit-profile");
  revalidatePath("/seller/dashboard");

  return { success: true };
}

export async function updateStorefrontTheme(theme: string, scope?: string | null) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  await db
    .update(profiles)
    .set({ 
      storefrontTheme: theme,
      storefrontThemeScope: scope || undefined
    })
    .where(eq(profiles.userId, userId));

  await db
    .update(storefronts)
    .set({ 
      theme: theme,
      themeScope: scope || undefined
    })
    .where(eq(storefronts.userId, userId));

  const [seller] = await db.select({ handle: profiles.handle }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (seller?.handle) {
    revalidatePath(`/${seller.handle}`);
  }

  return { success: true };
}

export async function removeCardFromHeaderAction(cardId: number) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const [profile] = await db.select({ headerCustomizationIds: profiles.headerCustomizationIds, handle: profiles.handle })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!profile) return { error: "Profile not found" };

  const currentIds = (profile.headerCustomizationIds as number[]) || [];
  const newIds = currentIds.filter(id => id !== cardId);

  await db
    .update(profiles)
    .set({ headerCustomizationIds: newIds })
    .where(eq(profiles.userId, userId));

  if (profile.handle) {
    revalidatePath(`/${profile.handle}`);
  }
  revalidatePath(`/listings/`);
  return { success: true };
}
