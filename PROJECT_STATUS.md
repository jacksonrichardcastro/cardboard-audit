# Cardbound — Project Status

> **For Claude (any future session):** Read this file in full before taking any action on this project. It is the single source of truth for state, decisions, and process discipline. Update it at the end of every working session — stale sections are worse than no doc.

**Last updated:** 2026-04-22
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
- [ ] **Payment correctness.** Stripe is mocked in tests but double-charge, refund race, partial-refund, dispute, and failed-transfer flows need real integration tests (against Stripe test mode, not mocks).
- [ ] **Webhook idempotency.** `webhook_events` table exists but we haven't verified the handler rejects duplicate event IDs. Stripe retries aggressively; a non-idempotent handler = duplicate fulfillment.
- [ ] **Rate limiting.** No rate limiting visible in the codebase. Public endpoints (listing search, order creation) will be abused on day one without it.
- [ ] **Error monitoring.** No Sentry / error-tracker wired up. Cannot operate a high-traffic site blind.
- [ ] **Structured logging.** Need request IDs threaded through logs for incident triage.
- [ ] **Database indexes.** No audit of indexes vs. query patterns. A marketplace will have hot queries on listings by category/price/seller — confirm indexes exist.
- [ ] **Backups verified.** Supabase does backups, but has Jackson tested a restore?
- [ ] **PII handling.** Buyer/seller names, addresses, payment metadata. Confirm we're not logging PII and have a data-deletion path (GDPR/CCPA).
- [ ] **Content moderation.** User-submitted listings (card images, descriptions) need moderation — manual or automated — before going public.
- [ ] **Legal.** ToS, privacy policy, marketplace rules, tax obligations for the platform fee.

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

## 10. What to pick up next (open question)

Jackson has not yet decided the next piece of work post-CI-fix. When he does, candidates include:

- **Production-readiness hardening** (§6 blockers) — highest-leverage for a "high-traffic launch" goal.
- **Feature work** — whatever product direction he had in mind before CI became a rabbit hole. Ask him.
- **Observability wiring** (Sentry + structured logs) — cheap, unblocks everything else.

If in doubt, steer toward blockers in §6. A pretty feature on top of an un-monitored, un-rate-limited, un-idempotent marketplace will break within a week of real traffic.
