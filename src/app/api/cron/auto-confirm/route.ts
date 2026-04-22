import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, stateTransitions } from "@/lib/db/schema";
import { lt, and, eq } from "drizzle-orm";
import { processBuyerReceipt } from "@/lib/orders/confirm";

export async function GET(req: Request) {
  try {
    // Escrow sweep checking strictly for mature DELIVERED timestamps passing 72 HR bound
    const expirationThreshold = new Date();
    expirationThreshold.setHours(expirationThreshold.getHours() - 72);

    const expiredOrders = await db.select({ id: orders.id })
      .from(orders)
      .where(
        and(
          eq(orders.currentState, "PENDING_BUYER_CONFIRM"),
          lt(orders.deliveredAt, expirationThreshold)
        )
      );

    const results = [];
    
    for (const border of expiredOrders) {
      try {
        // We run the same strict architectural action a manual Buyer click triggers, preserving Audit immutability
        await processBuyerReceipt(border.id, { id: "system", role: "system" });
        results.push({ orderId: border.id, status: "Transferred" });
      } catch (err: any) {
        results.push({ orderId: border.id, status: "Failed", error: err.message });
      }
    }

    return NextResponse.json({ message: "Escrow Auto-Confirmation Complete", results });
  } catch (error: any) {
    console.error("[CRON_ERROR]", error);
    return new NextResponse("Internal Cron Failure", { status: 500 });
  }
}
