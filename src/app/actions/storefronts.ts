"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { storefronts, handleHistory, listings, categories } from "@/lib/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const RESERVED_HANDLES = [
  "admin", "settings", "dashboard", "api", "auth", "login", "register",
  "signup", "profile", "store", "shop", "checkout", "cart", "orders",
  "seller", "buyer", "help", "support", "about", "contact", "terms",
  "privacy", "trending", "explore", "search", "categories", "brands",
  "sell", "buy", "verify", "onboarding", "tracker", "me", "apply", "breaks"
];

const HANDLE_REGEX = /^[a-z0-9-]+$/;

function validateHandle(handle: string) {
  if (!handle || handle.length < 3 || handle.length > 30) {
    return { error: "Handle must be between 3 and 30 characters" };
  }
  if (!HANDLE_REGEX.test(handle)) {
    return { error: "Handle can only contain lowercase letters, numbers, and hyphens" };
  }
  if (handle.startsWith("-") || handle.endsWith("-")) {
    return { error: "Handle cannot start or end with a hyphen" };
  }
  if (RESERVED_HANDLES.includes(handle)) {
    return { error: "This handle is reserved" };
  }
  return null;
}

export async function createStorefrontAction(handle: string, displayName?: string, bio?: string, avatarUrl?: string, theme: string = "trax-cosmos") {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const handleValidation = validateHandle(handle);
  if (handleValidation) return handleValidation;

  try {
    const existing = await db.query.storefronts.findFirst({
      where: eq(sql`LOWER(${storefronts.handle})`, handle.toLowerCase())
    });
    
    if (existing) {
      return { error: "This handle is already taken" };
    }

    const [newStorefront] = await db.insert(storefronts).values({
      userId,
      handle: handle.toLowerCase(),
      displayName: displayName || null,
      bio: bio || null,
      avatarUrl: avatarUrl || null,
      theme,
      isDefaultForUser: false,
    }).returning({ id: storefronts.id });

    revalidatePath("/seller/dashboard");
    return { success: true, id: newStorefront.id };
  } catch (err) {
    console.error("Error creating storefront:", err);
    return { error: "Failed to create storefront" };
  }
}

export async function setDefaultStorefrontAction(storefrontId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  try {
    const storefront = await db.query.storefronts.findFirst({
      where: and(eq(storefronts.id, storefrontId), eq(storefronts.userId, userId))
    });

    if (!storefront) {
      return { error: "Storefront not found or unauthorized" };
    }

    await db.transaction(async (tx) => {
      await tx.update(storefronts)
        .set({ isDefaultForUser: false })
        .where(eq(storefronts.userId, userId));

      await tx.update(storefronts)
        .set({ isDefaultForUser: true })
        .where(eq(storefronts.id, storefrontId));
    });

    revalidatePath("/seller/dashboard");
    revalidatePath(`/${storefront.handle}`);
    return { success: true };
  } catch (err) {
    console.error("Error setting default storefront:", err);
    return { error: "Failed to set default storefront" };
  }
}

export async function switchActiveStorefrontAction(storefrontId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  try {
    const storefront = await db.query.storefronts.findFirst({
      where: and(eq(storefronts.id, storefrontId), eq(storefronts.userId, userId))
    });

    if (!storefront) {
      return { error: "Storefront not found or unauthorized" };
    }

    const cookieStore = await cookies();
    cookieStore.set("active_storefront_id", storefrontId, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });

    return { success: true, handle: storefront.handle };
  } catch (err) {
    console.error("Error switching storefront:", err);
    return { error: "Failed to switch storefront" };
  }
}

export async function deleteStorefrontAction(storefrontId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  try {
    const allStorefronts = await db.query.storefronts.findMany({
      where: eq(storefronts.userId, userId)
    });

    if (allStorefronts.length <= 1) {
      return { error: "Cannot delete your only storefront" };
    }

    const storefrontToDelete = allStorefronts.find(s => s.id === storefrontId);
    if (!storefrontToDelete) {
      return { error: "Storefront not found" };
    }

    if (storefrontToDelete.isDefaultForUser) {
      return { error: "Cannot delete your default login storefront. Please set another storefront as default first." };
    }

    const defaultStorefront = allStorefronts.find(s => s.isDefaultForUser);
    if (!defaultStorefront) {
      return { error: "System error: No default storefront found to reassign listings." };
    }

    await db.transaction(async (tx) => {
      // Reassign listings
      await tx.update(listings)
        .set({ storefrontId: defaultStorefront.id })
        .where(eq(listings.storefrontId, storefrontId));

      // Reassign categories
      await tx.update(categories)
        .set({ storefrontId: defaultStorefront.id })
        .where(eq(categories.storefrontId, storefrontId));

      // Delete the storefront
      await tx.delete(storefronts)
        .where(eq(storefronts.id, storefrontId));
    });

    // Clear active storefront cookie if it was the one deleted
    const cookieStore = await cookies();
    if (cookieStore.get("active_storefront_id")?.value === storefrontId) {
      cookieStore.delete("active_storefront_id");
    }

    revalidatePath("/seller/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Error deleting storefront:", err);
    return { error: "Failed to delete storefront" };
  }
}

export async function updateStorefrontAction(storefrontId: string, data: {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  theme?: string;
  themeScope?: string;
  headerCustomizationIds?: any[];
  hiddenBadges?: string[];
}) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  try {
    const storefront = await db.query.storefronts.findFirst({
      where: and(eq(storefronts.id, storefrontId), eq(storefronts.userId, userId))
    });

    if (!storefront) {
      return { error: "Storefront not found or unauthorized" };
    }

    const updateData: any = {};
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.theme !== undefined) updateData.theme = data.theme;
    if (data.themeScope !== undefined) updateData.themeScope = data.themeScope;
    if (data.headerCustomizationIds !== undefined) updateData.headerCustomizationIds = data.headerCustomizationIds;
    if (data.hiddenBadges !== undefined) updateData.hiddenBadges = data.hiddenBadges;

    if (Object.keys(updateData).length > 0) {
      await db.update(storefronts)
        .set(updateData)
        .where(eq(storefronts.id, storefrontId));
    }

    revalidatePath(`/${storefront.handle}`);
    revalidatePath("/seller/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Error updating storefront:", err);
    return { error: "Failed to update storefront" };
  }
}

export async function changeStorefrontHandleAction(storefrontId: string, newHandle: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const handleValidation = validateHandle(newHandle);
  if (handleValidation) return handleValidation;

  try {
    const storefront = await db.query.storefronts.findFirst({
      where: and(eq(storefronts.id, storefrontId), eq(storefronts.userId, userId))
    });

    if (!storefront) {
      return { error: "Storefront not found or unauthorized" };
    }

    if (storefront.handle === newHandle.toLowerCase()) {
      return { error: "This is already your handle" };
    }

    const existing = await db.query.storefronts.findFirst({
      where: eq(sql`LOWER(${storefronts.handle})`, newHandle.toLowerCase())
    });

    if (existing) {
      return { error: "This handle is already taken" };
    }

    const oldHandle = storefront.handle;

    await db.transaction(async (tx) => {
      await tx.update(storefronts)
        .set({ handle: newHandle.toLowerCase() })
        .where(eq(storefronts.id, storefrontId));

      await tx.insert(handleHistory).values({
        userId,
        storefrontId,
        oldHandle: oldHandle.toLowerCase(),
        newHandle: newHandle.toLowerCase()
      });
    });

    revalidatePath(`/${oldHandle}`);
    revalidatePath(`/${newHandle.toLowerCase()}`);
    revalidatePath("/seller/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Error changing handle:", err);
    return { error: "Failed to change handle" };
  }
}
