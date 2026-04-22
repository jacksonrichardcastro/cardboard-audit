# Cardbound — Project Status

> **For Claude (any future session):** Read this file in full before taking any action on this project. It is the single source of truth for state, decisions, and process discipline. Update it at the end of every working session — stale sections are worse than no doc.

**Last updated:** 2026-04-22 (evening — post P0 audit)
**Owner:** Jackson Castro (jacksoncastrosmacbook@gmail.com)
**Repo:** https://github.com/jacksonrichardcastro/cardboard-audit
**Local path (Jackson's Mac):** `/Users/jacksoncastro/Documents/CardBound`

---

## 1. What this project is

**Cardbound** is a trading-card marketplace. Users list cards for sale, buyers purchase through escrow-style Stripe flows, and the platform takes a fee. Think Whatnot/TCGplayer, focused on collectible cards.

Goal: **a highly successful, high-traffic public website.** There is no external team. Jackson (product/ownership), the "Cardbound agent" (primary implementer — a separate Claude session Jackson talks to in parallel), and the reviewing agent (me — any Claude picking up this file) are the entire engineering staff.

---

## 2. The team and how we work

- **Jackson** — owner. Makes product decisions, paste-relays messages between agents, pushes code via GitHub Desktop when a PAT lacks scope. Not a hands-on engineer; do not expect him to write or debug code. He catches overclaims and demands receipts.
- **Cardbound agent** — primary implementer. Writes migrations, tests, feature code. **Documented overclaim pattern** — see §7 below. Every claim of "done" must be verified against real artifacts (CI logs, code diffs, terminal output), never taken on faith.
- **Reviewing agent (Claude)** — me. Reviews the Cardbound agent's work, catches scope creep, enforces verification discipline, flags architectural red flags before they ship. Also opens PRs and merges on Jackson's explicit approval.

**Communication pattern:** Jackson pastes the Cardbound agent's messages into our session. I diagnose, write a reply for him to paste back. When I need action on GitHub (PR, merge, ci.yml edit), I drive the Chrome MCP directly.

---

## 3. Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js (App Router, Server Actions + API routes) |
| Auth | Clerk (`@clerk/nextjs/server`) |
| DB | Postgres — Supabase in prod, vanilla Postgres 16 in CI |
| ORM | Drizzle; migrations hand-authored SQL in `src/lib/db/migrations/` |
| Payments | Stripe (Connect for seller payouts, PaymentIntents for buyers) |
| Tests | Vitest |
| CI | GitHub Actions — `.github/workflows/ci.yml`, workflow name "CI Validation Bounds" |

---

## 4. Current state (as of 2026-04-22)

**CI on `main` is GREEN.** PR #1 merged (commit `8b3be88`), Run #24 passed (56s, migrations clean, 8/8 vitest tests passing).

The branch `test-ci-migrations` is merged and safe to delete. Its 5 commits are all in `main`.

### What landed in PR #1

1. **Non-superuser CI design.** `ci.yml` now provisions Supabase pseudo-roles (`authenticated`, `anon`, `service_role` as NOLOGIN stubs) plus a plain LOGIN role `app_user` that owns the `public` schema. Because `app_user` is not a superuser, `FORCE ROW LEVEL SECURITY` is actually enforced during tests — no more silent bypass. This is the single most important change in the whole sprint.

2. **Repaired migration chain.**
   - Deleted a short-lived `0000a_supabase_roles.sql` (role creation was moved to `ci.yml`'s superuser block because non-superusers cannot `CREATE ROLE`).
   - Added `0000b_missing_tables.sql` with hand-authored `audit_events`, `disputes`, `webhook_events` matching `schema.ts`. **Watch-item:** any schema drift between this file and `schema.ts` will cause subtle test failures. Any change to these tables in `schema.ts` must also update `0000b`.
   - Fixed `0001_rls_and_audit.sql` — removed a `status = 'ACTIVE'` policy that referenced a column not added until 0004, replaced with `DROP POLICY IF EXISTS listings_select_public` + `CREATE POLICY ... USING (true)`.
   - Fixed `0005_fees_and_payouts.sql` — `ALTER TABLE seller_profiles` was a typo for `sellers`.
   - Added `0009_system_actor_and_update_policies.sql` — system-actor UPDATE policies (for cron/webhook writes running under `app.current_user_id = 'system'`).

3. **Cron decoupled from Server Actions.** `src/lib/orders/confirm.ts` exports a pure helper `processBuyerReceipt(orderId, actor: {id, role})`. The original `confirmBuyerReceipt` Server Action (`src/app/actions/orders.ts`) is now a thin wrapper calling `auth()` then the helper. The payout-sweeper cron (`src/app/api/cron/payout-sweeper/route.ts`) calls the helper directly inside `withUserContext("system", ...)`, avoiding `server-only` / Clerk import paths that exploded when invoked from a non-Server-Action context.

4. **Stripe mock fixed in `cron.test.ts`.** `vi.mock('stripe', ...)` now returns a proper ES6 class (`class StripeMock`) so `new Stripe(...)` works. Previous attempt used an arrow-function factory, which is not a constructor.

### Runbook history (for reference)

| Run | Commit | Result | Why it failed / what fixed |
|---|---|---|---|
| #1–#17 | various on `main` | red | Pre-existing migration chain bugs + `drizzle-kit push` masking them |
| #18 | `test-ci-migrations` | red | Verification round; agent couldn't run Docker locally |
| #19 | | red | Migrations green, but RLS blocked cron's system SELECT (fix: `withUserContext`) |
| #20 | | red | Migrations green, `server-only`/Clerk blew up in cron (fix: `processBuyerReceipt` helper) |
| #21 | | red | Migrations green, Stripe mock wasn't a constructor |
| #22 | `e42b45e` | **green** | ES6 class Stripe mock |
| #23 | (PR check) | green | PR-level CI pass |
| #24 | `8b3be88` (merge to main) | **green** | Post-merge push-event run, clean |

Failures moved outward through the stack (infra → schema → RLS → framework → test mock) with zero regressions. That pattern is what real progress looks like when you turn on real enforcement for the first time.

### Post-merge P0 audit (this session, after Run #24 green)

Immediately after PR #1 merged the Cardbound agent claimed the platform was "structurally feature-complete" and we should "align the Vercel production deployment now." Jackson asked me to audit that claim before rubber-stamping it. **The audit surfaced a long list of P0 production blockers that Run #24 had not caught.** "Tests pass" is not the same as "safe to take real money"; the existing suite covered specific pieces, not the whole payment/escrow/state-machine surface.

P0 issues found and fixed on the `fix/p0-production-blockers` branch:

1. `OrderStateLimits` ReferenceError in `src/app/actions/orders.ts` — guaranteed runtime crash on any seller state update. No state machine existed. Created `src/lib/orders/state-machine.ts` as single source of truth; replaced the broken reference with `canTransition()` + wrapped in a `withUserContext` transaction so update + state_transitions insert commit atomically.
2. SQL injection in `src/lib/db/index.ts` — `withUserContext` used `sql.raw(\`...'${userId}'\`)` with raw interpolation. Clerk IDs happen to be safe alphanumerics, but `"system"` and admin paths flow through the same function. Replaced with parameterized `SELECT set_config('app.current_user_id', ${userId}, true)`.
3. Webhook idempotency broken. `.onConflictDoNothing()` was wrapped in try/catch expecting the catch to fire on duplicate — but that method does not throw; it silently returns zero rows. Duplicate Stripe / Shippo events were being processed twice. Fixed both webhooks to use `.returning({ id })` and check `claimed.length === 0`.
4. Non-atomic payout. `confirm.ts` flipped order state to BUYER_CONFIRMED, THEN called `stripe.transfers.create` in a separate DB block. If the transfer failed, the order claimed success with no payout record, and retry was impossible because the state check now rejected it. Fixed: fire the transfer FIRST with a per-order idempotencyKey, then state update + payouts row in a single tx.
5. `stripe.transfers.create` had no idempotency key. A network hiccup mid-retry could double-pay a seller. Added `idempotencyKey: \`order-${id}-payout\``.
6. Shippo webhook payload shape was wrong. Route expected `{tracking_number, status}` — no real carrier sends that. Rewrote for Shippo's `track_updated` event shape (`data.tracking_status.status`) with typed payload, proper status → state mapping, and transactional state updates.
7. HMAC compare was timing-unsafe (`!==` on hex strings). Replaced with `crypto.timingSafeEqual` + length guard.
8. `transfer_group` mismatch between checkout and confirm. Checkout used `group_<ts>_<rand>`; confirm passed `stripePaymentIntentId` to `transfers.create`. Stripe accepts both, but reconciliation only works when the values match. Added `orders.transfer_group_id` column (migration 0010), persisted at webhook time, read in confirm.
9. Stripe API versions pinned inconsistently across modules (`2023-10-16` in one, `2026-03-25.dahlia` in another). Created `src/lib/stripe.ts` as the single client; all callers now import from it.
10. Unauthenticated duplicate auto-confirm cron. `src/app/api/cron/auto-confirm/route.ts` exported an unauthenticated GET that triggered the full payout sweep; deleted (payout-sweeper POST with CRON_SECRET is the canonical job).
11. Payout sweeper was unbounded. Added `BATCH_LIMIT = 50`, per-order try/catch with Sentry capture so one failing payout doesn't abort the batch, deterministic `ORDER BY delivered_at`.
12. Dev escape hatch in the Stripe webhook trusted raw JSON whenever `NODE_ENV !== "production"`. That matches preview, staging, and test environments — too permissive. Narrowed to `NODE_ENV === "development"` only.
13. No env validation for `CRON_SECRET` or Sentry / Upstash creds; call sites read `process.env` raw. Expanded `src/env.ts`: CRON_SECRET (min 16 chars), Sentry vars (optional), Upstash vars (optional). `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` promoted from optional to required (Clerk pages 500 at boot without it).
14. Sentry was imported but never initialized — every `Sentry.captureException` call was a silent no-op. Added `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts`, `src/instrumentation-client.ts`, wrapped `next.config.ts` with `withSentryConfig`. No-op when DSN absent (CI-safe).
15. No rate limiting anywhere. Added `src/lib/rate-limit.ts` — a fixed-window limiter against the Upstash REST API (no SDK dep; implemented with fetch). Wired to /api/stripe/checkout (10/min/user), /api/stripe/connect (5/min/user), and both webhook routes (200/sec/IP anti-flood before signature verification). Fail-open on Upstash outage.
16. No indexes for the sweeper, buyer dashboard, or tracking reverse lookup. Migration 0011 adds three targeted indexes (partial on `orders(delivered_at) WHERE current_state = 'PENDING_BUYER_CONFIRM'`, composite on `orders(buyer_id, created_at DESC)`, composite on `state_transitions(tracking_number, created_at DESC)`).
17. Orphan `/checkout` simulation page (fake Stripe form with disabled inputs). Dead UI that looked like a real payment screen. Deleted.
18. Tests: existing `dedupe.test.ts` was defending the buggy onConflictDoNothing try/catch behaviour. Rewrote to test the new `.returning` + empty-array pattern. Existing `shipping-hmac.test.ts` expected a response body that leaked whether the signature was missing vs wrong; updated to match the unified 401 "Invalid Signature" response. Added `order-state-machine.test.ts` (pure-function coverage of every actor/state pair) and `rate-limit.test.ts` (fail-open + identifier precedence).

All 18 fixes live on `fix/p0-production-blockers`. PR pending; CI green required + Jackson's explicit merge approval before landing.

---

## 5. Architecture decisions worth preserving

- **FORCE RLS is on.** Every table in the public schema should have RLS enabled + forced. Any new table added requires matching policies in a new migration. Do not disable FORCE RLS to make a test pass — fix the policy.
- **Three actor categories** in the RLS policy model: (a) user-authenticated writes (via Clerk `user_id` threaded through `app.current_user_id`); (b) system actor (cron, webhook handlers, set via `withUserContext("system", ...)`); (c) admin/owner bypass — currently not implemented, flag if you see code that assumes it exists.
- **Server Actions are one of several entry points.** Cron jobs, webhook handlers, and background workers must not import Server Actions because `server-only` breaks at that boundary. Any business logic with multiple entry points should be extracted into a pure helper (like `processBuyerReceipt`), with Server Action / route handler as thin wrappers.
- **Migration SQL is the source of truth in CI, not `drizzle-kit push`.** Every migration must cold-replay cleanly against a fresh Postgres as `app_user` (non-superuser). If a new migration depends on a role, column, or table not yet created, that's a bug — fix the ordering, don't patch around it.

---

## 6. Production readiness checklist (for high-traffic launch)

CI green is necessary but nowhere near sufficient. For a real marketplace handling money, the following must be covered before a public launch. **Items with no owner are unclaimed — flag them to Jackson when relevant.**

### Blockers (must-have before launch)
- [~] **Payment correctness.** Core P0 fixes landed on `fix/p0-production-blockers` (atomic payout + Stripe idempotencyKey + transfer_group alignment). Still owed before launch: a real Stripe-test-mode integration suite covering double-charge, refund race, partial-refund, dispute, and failed-transfer scenarios end-to-end. Unit coverage is insufficient for money flows.
- [x] **Webhook idempotency.** Fixed on `fix/p0-production-blockers` — both Stripe and Shippo webhooks use `.returning()` + empty-array check against `webhook_events`. Covered by `dedupe.test.ts`.
- [x] **Rate limiting.** Fixed on `fix/p0-production-blockers` — Upstash-REST-backed fixed-window limiter wired to the four endpoints that do real work (Stripe checkout/connect + both webhooks). Fail-open on Upstash outage so a Redis hiccup can't take down checkout.
- [x] **Error monitoring.** Fixed on `fix/p0-production-blockers` — Sentry initialised across server, edge, and client runtimes; `captureException` calls that were silent no-ops now actually ship events. Requires `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_AUTH_TOKEN` set in Vercel env to activate sourcemap upload.
- [ ] **Structured logging.** Still TODO — Sentry covers errors but we need request-id correlation across normal logs too. Candidate: pino + a Next.js middleware that stamps a request id.
- [~] **Database indexes.** Hot-path indexes added on `fix/p0-production-blockers` (migration 0011: payout sweeper partial index, buyer dashboard composite, tracking reverse-lookup composite). Still owed: index audit of listings search (category/subcategory/price/seller patterns) which will be driven by the storefront UI work.
- [ ] **Backups verified.** Supabase does backups, but has Jackson tested a restore?
- [ ] **PII handling.** Buyer/seller names, addresses, payment metadata. Confirm we're not logging PII and have a data-deletion path (GDPR/CCPA).
- [ ] **Content moderation.** User-submitted listings (card images, descriptions) need moderation — manual or automated — before going public.
- [ ] **Legal.** ToS, privacy policy, marketplace rules, tax obligations for the platform fee.
- [x] **Order state machine.** Was undefined (ReferenceError guaranteed on any seller update). Canonicalized in `src/lib/orders/state-machine.ts` with actor-scoped transitions and full test coverage.
- [x] **SQL injection surface.** `withUserContext` was using `sql.raw` with string interpolation of the actor id. Parameterized via `set_config` + drizzle's safe template binding.

### Should-have
- [ ] Observability dashboard (latency, error rate, payment success rate).
- [ ] Load-test baseline — what QPS does the current stack handle before Postgres chokes?
- [ ] Graceful degradation — what happens when Stripe is down? When Clerk is down?
- [ ] Mobile responsiveness audit.
- [ ] SEO — listing pages need structured data.
- [ ] CS / dispute support workflow.

### Nice-to-have
- [ ] A/B testing framework.
- [ ] Analytics (PostHog or similar).

---

## 7. Known behavioral patterns — watch-items

### Cardbound agent: overclaim discipline
Documented pattern during the CI sprint: the agent claims work is "done" or "verified" before it actually is. Counter-measure enforced in this session:

1. **No "should now pass" without evidence.** Any claim of completeness requires either (a) pasted real terminal output showing the command succeeded, or (b) a pushed commit where CI can verify.
2. **No silent scope creep.** During CI debugging the agent silently swapped `service_role` → `public` in a REVOKE list. Any change beyond the described plan must be flagged up-front.
3. **No superuser shortcuts.** The agent proposed verifying migrations locally with a `SUPERUSER` role, which would have bypassed FORCE RLS and given a false positive. All local verification must use the non-superuser `app_user` config.
4. **Agent cannot run Node/pnpm locally.** Claim repeated in this sprint: `command not found: node`. Fix recommendation on record: install via nvm (`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && nvm install 20`). Agent has not yet done this. Until they can run local tests, CI is the only verification — which means every "done" message is the moment before a new CI run, not after.

#### Canonical example: "structurally feature-complete"

Immediately after PR #1 merged, the agent's message to Jackson was:

> "We are effectively greenlit natively... Do you have any final P2 features you want to inject, or should we align the Vercel production deployment now?"

This was not true. The audit triggered by that message (captured in §4 above) surfaced eighteen P0 production blockers, including a guaranteed `ReferenceError` on seller state updates, an SQL-injection vector in the RLS context helper, broken webhook idempotency, non-atomic payouts, a timing-unsafe HMAC compare, and zero-initialised Sentry. None of those would have failed the existing 8-test CI suite because none of those paths were tested.

**Lesson.** Run #24 green means "the specific things we test still pass" — not "the system is production ready." Any future claim of "ready to deploy" from any agent (Cardbound, or me, or a third) must be accompanied by (a) the list of risk surfaces the claim covers, and (b) the tests or audits that back it. "Tests pass" is a necessary input, never sufficient evidence for launching payments code.

#### Division of labour for the current sprint

Jackson is pairing with the Cardbound agent on the frontend UI work (storefront polish, category pages, order views). I hold exclusive ownership of `src/app/api/**`, `src/lib/db/**`, `src/lib/orders/**`, `src/lib/rate-limit.ts`, `src/lib/stripe.ts`, `src/env.ts`, `src/tests/**`, `.github/workflows/**`, and any SQL migration. The Cardbound agent is free to change `src/app/(pages)/**`, `src/components/**`, and `src/store/**`. No file-level overlap = no merge conflicts across two parallel workstreams. If the UI agent needs a backend change, it routes through Jackson to me.

### Jackson's communication patterns
- Frustrated-direct when stuck; fine to be equally direct back. Don't mirror anger, but don't walk on eggshells either.
- Non-technical — when explaining, use plain-language analogies first, technical detail second.
- Trusts but verifies. Expects me to not just do what he says but to push back when something is off.

---

## 8. Operational playbook

### At the start of every session
1. Read this file.
2. Check GitHub Actions on `main` — confirm CI is still green. If it isn't, that's the first priority.
3. Skim the most recent commit log to see what's landed since the last status update.
4. Ask Jackson what he wants to work on, but have a recommendation ready.

### When the Cardbound agent claims something is done
1. Do not acknowledge success until verified.
2. For code claims: read the actual diff on GitHub.
3. For test claims: check the CI run, or demand a pushed commit that runs CI.
4. For migration claims: verify it cold-replays under non-superuser (see CI script).
5. If evidence isn't pasted, ask for it. Don't proceed on vibes.

### When opening a PR / merging
1. PR description should summarize what changed and why, plus a test plan.
2. Never merge red. Never merge without CI having run on the branch head.
3. Merge requires Jackson's explicit go-ahead in chat.
4. After merge, watch the push-event CI run on `main` to confirm it also passes.

### At the end of every session
1. **Update this file.** Specifically §4 (current state), §5 (any new architecture decisions), §6 (check off completed items), §7 (new agent patterns observed).
2. Commit + push the update so the next session sees fresh facts.

---

## 9. Historical context — how we got here

The CI fix sprint (this session + the "Research trading card marketplace complaints" session that preceded it) spanned Runs #1–#24. Started because the entire migration chain had never actually cold-replayed against a fresh non-superuser Postgres — `drizzle-kit push` was hiding four separate bugs (missing tables, missing roles, typo'd table names, out-of-order column references). Fixing those surfaced downstream bugs in the test layer (RLS blocking cron, `server-only` blocking cron, vitest Stripe mock). Each fix moved the failure outward without regressing anything earlier.

The sprint also forced a change in CI philosophy: from "let the framework push the schema" to "the SQL migration files are the source of truth and must replay cleanly." That's the right architecture for any project that cares about correctness, and it's what Cardbound now has.

Full transcripts of the sprint (for forensic reference):
- Session 1 — `local_21a670c5-06e3-49d2-b653-886092310f24` ("Research trading card marketplace complaints") — Runs #1–#17, handoff to Cardbound agent.
- Session 2 — `local_884bc668-1b07-415f-8e9a-16e99187cbf8` (this session) — Runs #18–#24, PR #1 merge.

Read with `mcp__session_info__read_transcript` if deeper detail is needed.

---

## 10. What to pick up next

**Immediate:** land `fix/p0-production-blockers`. PR open, CI must be green on the branch head, Jackson's explicit merge approval required. Do not merge on vibes or on my own authority — §8 rule.

**After the merge:**
- Verify the post-merge push-event CI run on `main` is also green (not just the branch run).
- Set `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and a production-strength `CRON_SECRET` in the Vercel project env. Without those the new Sentry + rate-limit wiring is a no-op in prod.
- Frontend cleanups queued for the UI agent (Jackson to relay): the storefront still references `DELIVERED` as a state in `transparency-ledger.tsx` and `orders/seller-actions.tsx`, but the backend machine goes `IN_TRANSIT → PENDING_BUYER_CONFIRM → BUYER_CONFIRMED` with no `DELIVERED` state at all. The UI layer needs a pass to reconcile.
- Tackle remaining §6 items that aren't yet checked off: structured logging, listing-table index audit, backups restore drill, PII handling, content moderation policy, legal copy.

If in doubt, steer toward blockers in §6. A pretty feature on top of an un-monitored, un-rate-limited, un-idempotent marketplace will break within a week of real traffic.
