"use server";

import { db } from "@/lib/db";
import { referrals, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";

export async function processReferral() {
  const { userId } = await auth();
  if (!userId) return { success: false, reason: "not_authenticated" };

  const cookieStore = await cookies();
  const referrerId = cookieStore.get("trax_ref")?.value;
  const referralHandle = cookieStore.get("trax_ref_handle")?.value || "unknown";

  if (!referrerId) return { success: false, reason: "no_cookie" };

  try {
    // 1. Validate referrer exists and isn't self
    if (referrerId === userId) {
      // Clear cookie immediately if self-referral attempt
      cookieStore.delete("trax_ref");
      cookieStore.delete("trax_ref_handle");
      return { success: false, reason: "self_referral" };
    }

    // 2. NEW-SIGNUP GUARD: Check that the referred user is a new signup
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!currentUser) return { success: false, reason: "user_not_found" };

    const now = new Date();
    const created = new Date(currentUser.createdAt);
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

    // If account was created more than 24 hours ago, do not count as a new signup
    if (diffHours > 24) {
      cookieStore.delete("trax_ref");
      cookieStore.delete("trax_ref_handle");
      return { success: false, reason: "not_new_signup" };
    }

    // 3. Check if referral already exists to avoid duplicate constraint errors in logs
    const existing = await db.query.referrals.findFirst({
      where: eq(referrals.referredUserId, userId),
    });

    if (!existing) {
      // Insert the referral
      await db.insert(referrals).values({
        referrerUserId: referrerId,
        referredUserId: userId,
        referralHandleOrCode: referralHandle,
      });
    }

    // Clean up cookies
    cookieStore.delete("trax_ref");
    cookieStore.delete("trax_ref_handle");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to process referral:", error);
    // Ignore duplicate key violation gracefully
    if (error?.code === '23505') {
       cookieStore.delete("trax_ref");
       cookieStore.delete("trax_ref_handle");
       return { success: false, reason: "already_referred" };
    }
    return { success: false, reason: "error" };
  }
}
