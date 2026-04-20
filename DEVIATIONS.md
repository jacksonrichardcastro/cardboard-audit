# CardBound Architectural Deviations Report
*Prepared for the T3 Auditing Agent*

This document meticulously records every instance where we intentionally deviated from the master prompt's original Minimum Viable Product (MVP) baseline in order to harden the marketplace for production.

## 1. Escrow Mechanics (`stripe.transfers.create`)
**Original Expectation:** Trigger Stripe payouts directly inside `api/webhooks/stripe` inside the `checkout.session.completed` event.
**Why we deviated:** It is a massive legal liability. If you payout the seller immediately at checkout, you lose the escrow funds. If the seller never ships the card, you owe the buyer a refund out of your own platform pocket. 
**Our Solution:** We separated the logic. `checkout.session.completed` simply registers the order (`PAID` status) and locks the money inside the Stripe Connected Platform. We introduced an asynchronous cron/action (`actions/orders.ts -> confirmBuyerReceipt`) that executes explicit Stripe Transfers only *after* the item is verified delivered.

## 2. Environment Variables Constraints
**Original Expectation:** Rely on standard Node `process.env` configurations and simple `|| "fallback"` logic.
**Why we deviated:** Fallback strings mask critical deployment failures. 
**Our Solution:** Incorporated `@t3-oss/env-nextjs` and `zod`. We enforce strict schemas on `DATABASE_URL` and `STRIPE_SECRET_KEY`. If keys are missing, the compiler actively halts Next.js `build` execution, forcing a fail-fast state preventing un-secured applications from deploying.

## 3. Disentanglement of Admin Roles
**Original Expectation:** Minimal or implicit administrative routing.
**Why we deviated:** Mock logic inside `/admin/...` routing dashboards falsely simulated security bindings.
**Our Solution:** Admin status is explicitly tied strictly to Clerk's `sessionClaims.public_metadata.role === "admin"` injected at the session level. Actions such as `getPendingSellers` verify this claim server-side before Drizzle is ever permitted to query the database.

## 4. Financial Calculations using Integer Mathematics
**Original Expectation:** Standard javascript arithmetic (e.g., `$10.50 * 0.10`).
**Why we deviated:** Floating-point arithmetic creates rounding fragmentation resulting in lost pennies that stack into massive accounting discrepancies at scale.
**Our Solution:** Centralized all logic in `payout-math.ts`. We exclusively accept inputs defined strictly in *cents* (`priceCents`). We utilize `Math.round()` on fee calculations natively discarding floating values.

## 5. Idempotent Data Transactions
**Original Expectation:** Standard Webhooks.
**Why we deviated:** Network retries cause the same Stripe hook to execute multiple times, resulting in Duplicate Order generations and lost funds. 
**Our Solution:** Deployed `webhook_events` PostgreSQL table. Each web-hook inherently executes `db.select(webookEvents).where(eq(id, event.id))` preventing catastrophic duplicate actions.

## 6. Immutable Ledger RLS Constraints
**Original Expectation:** Simple generic tables.
**Why we deviated:** Un-fenced `audit_events` or `payouts` data layers could theoretically be manipulated by a breached service account.
**Our Solution:** Hardcoded PostgeSQL bounds disabling mutations natively via `REVOKE UPDATE, DELETE ON payouts FROM authenticated, anon, public;`
