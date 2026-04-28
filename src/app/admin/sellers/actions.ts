"use server";

import { db } from "@/lib/db";
import { sellers, sellerApprovalQueue } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function approveSellerAction(sellerId: string) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.public_metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");

  await db.transaction(async (tx) => {
    await tx.update(sellers)
      .set({ approvalStatus: "approved", approvedAt: new Date() })
      .where(eq(sellers.userId, sellerId));
      
    await tx.update(sellerApprovalQueue)
      .set({ reviewedAt: new Date() })
      .where(eq(sellerApprovalQueue.sellerId, sellerId));
  });

  revalidatePath('/admin/sellers');
  redirect('/admin/sellers');
}

export async function rejectSellerAction(sellerId: string, reason: string) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.public_metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");

  if (!reason || reason.trim().length === 0 || reason.length > 500) {
    throw new Error("Reason must be between 1 and 500 characters");
  }

  await db.transaction(async (tx) => {
    await tx.update(sellers)
      .set({ approvalStatus: "rejected", rejectionReason: reason })
      .where(eq(sellers.userId, sellerId));
      
    await tx.update(sellerApprovalQueue)
      .set({ reviewedAt: new Date(), reviewerNotes: reason })
      .where(eq(sellerApprovalQueue.sellerId, sellerId));
  });

  revalidatePath('/admin/sellers');
  redirect('/admin/sellers');
}
