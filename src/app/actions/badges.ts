"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function hideBadgeAction(slug: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [profile] = await db.select({ 
    handle: profiles.handle, 
    hiddenBadges: profiles.hiddenBadges 
  }).from(profiles).where(eq(profiles.userId, userId)).limit(1);

  if (!profile) throw new Error("Profile not found");

  const currentHidden = Array.isArray(profile.hiddenBadges) ? profile.hiddenBadges : [];
  if (!currentHidden.includes(slug)) {
    const newHidden = [...currentHidden, slug];
    await db.update(profiles).set({ hiddenBadges: newHidden }).where(eq(profiles.userId, userId));
  }

  if (profile.handle) {
    revalidatePath(`/${profile.handle}`);
  }
  revalidatePath("/seller/settings");

  return { success: true };
}

export async function showBadgeAction(slug: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [profile] = await db.select({ 
    handle: profiles.handle, 
    hiddenBadges: profiles.hiddenBadges 
  }).from(profiles).where(eq(profiles.userId, userId)).limit(1);

  if (!profile) throw new Error("Profile not found");

  const currentHidden = Array.isArray(profile.hiddenBadges) ? profile.hiddenBadges : [];
  if (currentHidden.includes(slug)) {
    const newHidden = currentHidden.filter((b) => b !== slug);
    await db.update(profiles).set({ hiddenBadges: newHidden }).where(eq(profiles.userId, userId));
  }

  if (profile.handle) {
    revalidatePath(`/${profile.handle}`);
  }
  revalidatePath("/seller/settings");

  return { success: true };
}
