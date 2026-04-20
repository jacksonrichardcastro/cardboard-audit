"use server";

import { db, withUserContext } from "@/lib/db";
import { disputes, orders, stateTransitions } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function openDispute(payload: { orderId: number, reason: string, reasonText: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const currentOrder = await withUserContext(userId, async (tx) => {
    const [record] = await tx.select().from(orders).where(eq(orders.id, payload.orderId)).limit(1);
    return record;
  });

  if (!currentOrder) throw new Error("Order not found");
  if (currentOrder.buyerId !== userId && currentOrder.sellerId !== userId) {
      throw new Error("Unauthorized restriction bounds");
  }

  // P1-1: Mutate database boundaries securely inside Context Wrapper
  await withUserContext(userId, async (tx) => {
      await tx.insert(disputes).values({
          orderId: payload.orderId,
          openedBy: userId,
          reason: payload.reason,
          reasonText: payload.reasonText,
          status: "OPEN"
      });
    
      // Suspend Order Escrow natively
      await tx.update(orders).set({ currentState: "DISPUTED" }).where(eq(orders.id, payload.orderId));
      
      await tx.insert(stateTransitions).values({
          orderId: payload.orderId,
          newState: "DISPUTED",
          previousState: currentOrder.currentState,
          actorId: userId,
          notes: `Escrow Suspended securely tracking Dispute Reason: ${payload.reason}`
      });
  });

  return { success: true };
}
