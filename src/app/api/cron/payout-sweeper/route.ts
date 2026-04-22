import { NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { processBuyerReceipt } from "@/lib/orders/confirm";
import { env } from "@/env";
import * as Sentry from "@sentry/nextjs";

/**
 * Auto-confirm sweeper. Runs on a Vercel Cron schedule (configured in
 * vercel.json) — finds orders still sitting in PENDING_BUYER_CONFIRM more
 * than 72h past delivery, and fires the payout on the buyer's behalf.
 *
 * Hardening vs. the previous naive version:
 * - Capped per-run batch size so an outage-recovery flush can't exceed
 *   the Vercel function timeout (default 60s) or Stripe rate limits.
 * - Per-order try/catch so one failing transfer doesn't abort the batch.
 * - Stripe idempotency keys in processBuyerReceipt make retries safe even
 *   if the same order is picked up twice across runs.
 * - Auth via env-validated CRON_SECRET (no more raw process.env read).
 */

// Keep the run bounded: Stripe has a 100 req/sec default rate limit on
// transfers.create and we don't want to saturate it. With sequential
// awaits at ~200ms per Stripe round-trip this leaves ~10s of headroom on
// a 60s Vercel function timeout.
const BATCH_LIMIT = 50;

export async function POST(req: Request) {
  if (req.headers.get("Authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const staleOrders = await withUserContext("system", async (tx) => {
    return await tx
      .select({ id: orders.id })
      .from(orders)
      .where(
        and(
          eq(orders.currentState, "PENDING_BUYER_CONFIRM"),
          sql`${orders.deliveredAt} < NOW() - INTERVAL '72 hours'`,
        ),
      )
      .orderBy(orders.deliveredAt)
      .limit(BATCH_LIMIT);
  });

  let succeeded = 0;
  const failures: Array<{ orderId: number; error: string }> = [];

  for (const order of staleOrders) {
    try {
      await processBuyerReceipt(order.id, { id: "system", role: "system" });
      succeeded += 1;
    } catch (err: any) {
      failures.push({ orderId: order.id, error: err?.message ?? String(err) });
      Sentry.captureException(err, {
        tags: { where: "payout_sweeper" },
        extra: { orderId: order.id },
      });
      // Continue — one failing payout must not block the rest of the batch.
    }
  }

  return NextResponse.json({
    candidates: staleOrders.length,
    succeeded,
    failed: failures.length,
    failures,
    batchLimit: BATCH_LIMIT,
  });
}
