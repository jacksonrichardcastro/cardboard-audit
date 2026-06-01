"use server";

import { db } from "@/lib/db";
import { profiles, sellerApprovalQueue } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function acceptLegal() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [seller] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (!seller) throw new Error("Seller profile not found");

  const isApproved = seller.approvalStatus === "approved";

  await db.transaction(async (tx) => {
    await tx.update(profiles).set({
      tosAcceptedAt: new Date(),
      photoGuidelinesAcceptedAt: new Date(),
      approvalStatus: isApproved ? "approved" : "pending_review",
    }).where(eq(profiles.userId, userId));

    const existing = await tx.select().from(sellerApprovalQueue).where(eq(sellerApprovalQueue.sellerId, userId)).limit(1);

    if (existing.length === 0) {
      await tx.insert(sellerApprovalQueue).values({
        sellerId: userId,
        submittedAt: new Date(),
        reviewedAt: isApproved ? new Date() : null,
      });
    }
  });
  
  return { isApproved };
}
