"use server";

import { db } from "@/lib/db";
import { sellers, sellerApprovalQueue } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function acceptLegal() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [seller] = await db.select().from(sellers).where(eq(sellers.userId, userId)).limit(1);
  if (!seller) throw new Error("Seller profile not found");

  await db.transaction(async (tx) => {
    await tx.update(sellers).set({
      tosAcceptedAt: new Date(),
      photoGuidelinesAcceptedAt: new Date(),
      approvalStatus: "pending_review",
    }).where(eq(sellers.userId, userId));

    await tx.insert(sellerApprovalQueue).values({
      sellerId: userId,
      submittedAt: new Date(),
    });
  });
}
