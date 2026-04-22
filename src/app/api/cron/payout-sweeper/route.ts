import { NextResponse } from "next/server";
import { db, withUserContext } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { processBuyerReceipt } from "@/lib/orders/confirm";

export async function POST(req: Request) {
  // CRON endpoint execution natively routed via Vercel Cron
  if (req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized Cron Execution", { status: 401 });
  }

  try {
    // Locate orders shipped > 72h ago sitting in PENDING_BUYER_CONFIRM
    // P0: Must be executed strictly within system boundaries enforcing SELECT policies
    const staleOrders = await withUserContext("system", async (tx) => {
      return await tx.select({ id: orders.id })
        .from(orders)
        .where(
          and(
            eq(orders.currentState, "PENDING_BUYER_CONFIRM"),
            sql`${orders.deliveredAt} < NOW() - INTERVAL '72 hours'` // P0-7 Escrow Boundary definitively set
          )
        );
    });

    // Iteratively process
    for (const order of staleOrders) {
      await processBuyerReceipt(order.id, { id: "system", role: "system" });
    }

    return NextResponse.json({ processed: staleOrders.length });
  } catch (err: any) {
    console.error("[CRITICAL CRON FAILURE]", err);
    return new NextResponse("Cron Exception", { status: 500 });
  }
}
