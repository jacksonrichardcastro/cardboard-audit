# CardBound Architecture

## Tech Stack
- **Frontend / API:** Next.js (App Router, TS Strict)
- **Database:** Supabase Postgres
- **ORM:** Drizzle ORM
- **Auth:** Clerk (w/ Custom JWT to Supabase RLS)
- **Payments:** Stripe (Connect + Checkout + Identity)
- **UI:** Tailwind CSS + shadcn/ui

## Design Decisions

### Integer Cents for Finance
Floating point math generates rounding errors. *All* financial logic, from `priceCents` to `feeCents` is strictly an integer representing cents to guarantee 100% precision.

### The Order Transparency Ledger
To satisfy the mandate of absolute transparency and immutable tracking, order states (`PAID`, `SHIPPED`, etc.) are tracked historically in the `state_transitions` table. This serves as an append-only audit trail. The `currentState` in the `orders` table is a denormalized cache of the latest transition.

### State Machine Flow
An order moves through these precise states:
1. `PAID` (triggered by Stripe webhook)
2. `SELLER_RECEIVED` (seller acknowledges payout pending / order valid)
3. `PACKAGED`
4. `SHIPPED` (carrier + tracking strictly required)
5. `IN_TRANSIT` (EasyPost webhook updates)
6. `DELIVERED` (EasyPost webhook updates)
7. `BUYER_CONFIRMED` (Buyer manually clicks received, or 72 hour cron job)
8. *`DISPUTED` (Can branch off at any point post-payment before completion).*
