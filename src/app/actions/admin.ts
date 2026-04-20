"use server";

import { db, withUserContext } from "@/lib/db";
import { sellers, users } from "@/lib/db/schema";
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
       userId: sellers.userId,
       businessName: sellers.businessName,
       description: sellers.description,
       identityVerified: sellers.identityVerified,
       createdAt: sellers.createdAt,
       email: users.email
    }).from(sellers)
      .innerJoin(users, eq(sellers.userId, users.id))
      .where(eq(sellers.applicationStatus, "PENDING"))
      .orderBy(desc(sellers.createdAt));
  });
}

export async function approveSeller(sellerId: string) {
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.public_metadata as { role?: string })?.role;
  if (role !== "admin" || !userId) throw new Error("Unauthorized Administrative Context");

  const sellerRecord = await withUserContext(userId, async (tx) => {
    const [record] = await tx.select().from(sellers).where(eq(sellers.userId, sellerId)).limit(1);
    return record;
  });
  
  if (!sellerRecord || !sellerRecord.identityVerified) {
    throw new Error("System blocked: Cannot approve unverified identity records");
  }

  await withUserContext(userId, async (tx) => {
    await tx.update(sellers)
      .set({ applicationStatus: "APPROVED" })
      .where(eq(sellers.userId, sellerId));
  });
    
  return { success: true };
}
