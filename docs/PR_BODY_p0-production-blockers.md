# PR title

fix: land the 18-item P0 production-blocker audit on top of PR #1

# PR body (paste into the GitHub PR description)

## Summary

This branch is the follow-on to the PR #1 "CI is green" merge. After that
merge the Cardbound agent said the platform was "structurally feature-
complete" and asked to green-light a Vercel production deploy. The audit
triggered by that message found **18 separate P0 production blockers**
that Run #24 green had not caught — because none of those code paths
were in the 8-test suite CI was running.

This PR lands every fix, the new tests that cover them, and the
documentation of the audit itself. Nothing here is speculative; every
commit maps to a named defect in `PROJECT_STATUS.md §4`.

**CI green is a precondition for merging, not a substitute for review.
Jackson's explicit go-ahead required (§8 of PROJECT_STATUS.md).**

## What's in the branch

Ten commits, in order:

1. `17bd77a fix(orders)` — Canonical order state machine at `src/lib/
   orders/state-machine.ts`; replaces the undefined `OrderStateLimits`
   reference that would have thrown `ReferenceError` on any seller
   dashboard state update.
2. `6b06a45 fix(db)` — Parameterize `withUserContext` actor id via
   `set_config(...)` to close an SQL-injection vector in the RLS
   helper. Clerk IDs were safe; `"system"`/admin paths flowed through
   the same code and were not.
3. `ad7d112 fix` — Webhook idempotency (`.returning()` + empty-array
   check in place of the onConflictDoNothing try/catch that could never
   fire); atomic payout (transfer THEN state-update-in-one-tx);
   per-order Stripe `idempotencyKey`; Shippo `track_updated` payload
   shape with real `data.tracking_status.status` decoding; shared
   Stripe client at `src/lib/stripe.ts` pinned to `"2024-06-20"`;
   timing-safe HMAC compare; `transfer_group_id` column on orders
   (migration 0010); `NODE_ENV === "development"` narrow dev escape
   hatch; deletion of unauthenticated `/api/cron/auto-confirm` GET.
4. `4028aaf feat(sentry)` — Server/edge/client Sentry init, env schema
   expansion (`CRON_SECRET`, Sentry + Upstash vars, Clerk key promoted
   to required), `withSentryConfig` wrapper on `next.config.ts`.
5. `d48d81e chore(checkout)` — Remove orphan `/checkout` simulation
   page (dead UI shaped like a real payment screen).
6. `bc72242 perf(db)` — Migration 0011: partial index for payout
   sweeper, composite for buyer dashboard, composite for tracking
   reverse lookup.
7. `b097c4a feat(security)` — Upstash-REST-backed fixed-window rate
   limiter (no SDK dep), wired to checkout/connect/both webhooks.
   Fail-open on Upstash outage.
8. `93ac6c7 test` — `order-state-machine.test.ts` (new, pure
   function), `rate-limit.test.ts` (new, fail-open + identifier
   precedence), `dedupe.test.ts` (rewritten for the new claim
   pattern), `shipping-hmac.test.ts` (updated to match unified 401 +
   new tampered-sig and happy-path cases).
9. `cd4889e docs(status)` — `PROJECT_STATUS.md §4/§6/§7/§10` updated
   with the audit findings, blocker checkbox updates, canonical
   overclaim example, and post-merge env-var checklist.
10. `9e6714d fix(stripe)` — Consolidate seller-KYC Stripe client onto
    `@/lib/stripe`; the file had its own `new Stripe()` pinned to the
    legacy `"2023-10-16"` API version.

## Test plan

- [ ] CI must be green on the branch head (`9e6714d`). Required checks:
      migrations cold-replay against fresh Postgres as `app_user`,
      vitest suite passes including the four new test files.
- [ ] Post-merge: verify the push-event CI run on `main` is also green.
- [ ] Before the first prod deploy that uses this branch: set the
      following in Vercel project env (all optional in the schema but
      required for the new wiring to do anything useful):
      `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`,
      `SENTRY_PROJECT`, `UPSTASH_REDIS_REST_URL`,
      `UPSTASH_REDIS_REST_TOKEN`, and a production-strength
      `CRON_SECRET` (min 16 chars, env schema enforces this).
- [ ] The payout-sweeper cron now lives only at POST
      `/api/cron/payout-sweeper` behind `Authorization: Bearer
      ${CRON_SECRET}`. The previous unauthenticated `/api/cron/
      auto-confirm` GET is deleted. Add a `vercel.json` in a follow-up
      if you want Vercel Cron to drive it — this PR intentionally does
      not include vercel.json because production schedule cadence is a
      product decision.
- [ ] Frontend follow-up for the Cardbound agent (does not block this
      PR): `TransparencyLedger` and `seller-actions` still reference a
      `DELIVERED` state that does not exist in the real state machine
      (`IN_TRANSIT → PENDING_BUYER_CONFIRM → BUYER_CONFIRMED`).
      Reconcile when the UI agent next touches those files.

## Known limits of this PR

- No real Stripe-test-mode end-to-end suite yet. Unit coverage is
  sufficient for the P0 fixes themselves but not for proving
  double-charge, refund race, partial-refund, dispute, and
  failed-transfer flows behave correctly against real Stripe. That's
  listed in `§6` as the remaining payment-correctness item.
- Structured logging (pino + request-id) not added here. Sentry
  captures errors; routine logs still go to stdout without correlation
  ids.
- Backup restore drill, PII handling audit, content moderation
  policy, and legal copy all remain open. Out of scope for a
  backend-hardening PR.
