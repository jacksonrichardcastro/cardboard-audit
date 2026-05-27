"use server";

import { db, withUserContext } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function getPendingSellers() {
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.public_metadata as { role?: string })?.role;
  if (role !== "admin" || !userId) throw new Error("Unauthorized Administrative Context");

  // P1-4: Resolving dynamically live-pending queues overriding mock invariants
  // P1-4: Resolving dynamically live-pending queues overriding mock invariants
  return await withUserContext(userId, async (tx) => {
    return await tx.select({
       userId: profiles.userId,
       businessName: profiles.businessName,
       description: profiles.description,
       identityVerified: profiles.identityVerified,
       createdAt: profiles.createdAt,
       email: users.email
    }).from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(profiles.applicationStatus, "PENDING"))
      .orderBy(desc(profiles.createdAt));
  });
}

export async function approveSeller(sellerId: string) {
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.public_metadata as { role?: string })?.role;
  if (role !== "admin" || !userId) throw new Error("Unauthorized Administrative Context");

  const sellerRecord = await withUserContext(userId, async (tx) => {
    const [record] = await tx.select().from(profiles).where(eq(profiles.userId, sellerId)).limit(1);
    return record;
  });
  
  if (!sellerRecord || !sellerRecord.identityVerified) {
    throw new Error("System blocked: Cannot approve unverified identity records");
  }

  await withUserContext(userId, async (tx) => {
    await tx.update(profiles)
      .set({ applicationStatus: "APPROVED" })
      .where(eq(profiles.userId, sellerId));
  });
    
  return { success: true };
}
