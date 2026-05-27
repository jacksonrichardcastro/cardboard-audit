"use server";

import { db } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getUserPreferences() {
  const { userId } = await auth();
  if (!userId) return null;

  const [prefs] = await db.select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return prefs || null;
}

export async function saveUserPreferences(sportCategories: string[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [existing] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);

  if (existing) {
    await db.update(userPreferences)
      .set({ sportCategories, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId));
  } else {
    await db.insert(userPreferences)
      .values({ userId, sportCategories });
  }

  revalidatePath("/for-you");
  revalidatePath("/");
  return { success: true };
}
