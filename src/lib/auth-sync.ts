import { db } from "@/lib/db";
import { users, profiles } from "@/lib/db/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { FOUNDING_SELLER_EMAILS } from "@/lib/founding-sellers";

export async function syncUserFromClerk() {
  const { userId } = await auth();
  if (!userId) return null;

  // Fast path — if the user and profile already exist in the local db, skip.
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
    
  const [existingProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (existingUser && existingProfile) return userId;

  // Slow path — user not in local db yet.
  try {
    const user = await currentUser();
    if (!user) return null;

    const email = user.emailAddresses[0]?.emailAddress?.toLowerCase();
    if (!email) return null;

    // Fix S: ALL new signups default to Seller role + Verified KYC + Approved status
    const initialRole = "seller";
    const isFoundingSeller = FOUNDING_SELLER_EMAILS.includes(email as any);

    await db
      .insert(users)
      .values({ 
        id: user.id, 
        email, 
        role: initialRole, 
        accountType: initialRole,
        isFoundingSeller
      })
      .onConflictDoUpdate({
        target: users.id,
        set: { email, isFoundingSeller },
      });

    const defaultName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : email.split('@')[0];
    
    // Ensure profile row exists with verified/approved status
    await db.insert(profiles)
      .values({
        userId: user.id,
        businessName: defaultName,
        displayName: defaultName,
        kycStatus: "verified",
        approvalStatus: "approved",
        applicationStatus: "approved",
        handle: `user-${user.id}`.toLowerCase(),
      })
      .onConflictDoNothing();

    return user.id;
  } catch (err) {
    console.error("[syncUserFromClerk] Failed to sync from Clerk:", err);
    return null;
  }
}
