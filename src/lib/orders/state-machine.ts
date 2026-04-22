/**
 * Order state machine.
 *
 * Single source of truth for allowed state transitions, keyed by the actor role
 * that's triggering the change. Matches the states rendered in
 * components/shared/transparency-ledger.tsx plus PENDING_BUYER_CONFIRM (buyer
 * has 72h after delivery before auto-confirm) and REFUNDED (terminal after
 * admin-resolved dispute).
 *
 * Any new transition must be added here AND covered by a test in
 * src/tests/order-state-machine.test.ts.
 */

export const ORDER_STATES = [
  "PAID",
  "SELLER_RECEIVED",
  "PACKAGED",
  "SHIPPED",
  "IN_TRANSIT",
  "PENDING_BUYER_CONFIRM",
  "BUYER_CONFIRMED",
  "DISPUTED",
  "REFUNDED",
] as const;

export type OrderState = (typeof ORDER_STATES)[number];

export type Actor = "seller" | "buyer" | "system" | "admin";

type Transition = { to: OrderState; actor: Actor };

/**
 * Allowed forward transitions from a given state. Each entry lists the target
 * state and the actor role permitted to make that change.
 *
 * Actor roles:
 *  - seller: the listing's seller, via the seller dashboard Server Actions
 *  - buyer:  the order's buyer, via the buyer dashboard Server Actions
 *  - system: carrier webhook, stripe webhook, or a cron (auto-confirm sweeper)
 *  - admin:  platform admin, via admin dashboard (dispute resolution, overrides)
 */
export const ORDER_STATE_TRANSITIONS: Record<OrderState, readonly Transition[]> = {
  PAID: [
    // Seller may step through SELLER_RECEIVED or skip straight to PACKAGED.
    // The current seller UI (components/orders/seller-actions.tsx) uses the
    // shortcut; both paths are legal.
    { to: "SELLER_RECEIVED", actor: "seller" },
    { to: "PACKAGED", actor: "seller" },
    { to: "DISPUTED", actor: "buyer" },
    { to: "DISPUTED", actor: "admin" },
  ],
  SELLER_RECEIVED: [
    { to: "PACKAGED", actor: "seller" },
    { to: "SHIPPED", actor: "seller" },
    { to: "DISPUTED", actor: "buyer" },
    { to: "DISPUTED", actor: "admin" },
  ],
  PACKAGED: [
    { to: "SHIPPED", actor: "seller" },
    { to: "DISPUTED", actor: "buyer" },
    { to: "DISPUTED", actor: "admin" },
  ],
  SHIPPED: [
    { to: "IN_TRANSIT", actor: "system" },
    { to: "PENDING_BUYER_CONFIRM", actor: "system" },
    { to: "DISPUTED", actor: "buyer" },
    { to: "DISPUTED", actor: "admin" },
  ],
  IN_TRANSIT: [
    { to: "PENDING_BUYER_CONFIRM", actor: "system" },
    { to: "DISPUTED", actor: "buyer" },
    { to: "DISPUTED", actor: "admin" },
  ],
  PENDING_BUYER_CONFIRM: [
    { to: "BUYER_CONFIRMED", actor: "buyer" },
    { to: "BUYER_CONFIRMED", actor: "system" }, // 72h auto-confirm sweeper
    { to: "DISPUTED", actor: "buyer" },
    { to: "DISPUTED", actor: "admin" },
  ],
  BUYER_CONFIRMED: [
    // Terminal under normal flow. Admin may force DISPUTED in rare escalation.
    { to: "DISPUTED", actor: "admin" },
  ],
  DISPUTED: [
    // Only admins resolve disputes.
    { to: "REFUNDED", actor: "admin" },
    { to: "BUYER_CONFIRMED", actor: "admin" },
  ],
  REFUNDED: [],
};

/**
 * Returns true iff `from -> to` is a valid transition when triggered by the
 * given actor role. Use this anywhere an order state is about to change.
 */
export function canTransition(from: OrderState, to: OrderState, actor: Actor): boolean {
  const allowed = ORDER_STATE_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.some((t) => t.to === to && t.actor === actor);
}

/**
 * Returns the valid next states from `from` for a given actor role, for
 * driving UI affordances (e.g. which buttons to show a seller on an order).
 */
export function nextStatesFor(from: OrderState, actor: Actor): OrderState[] {
  return (ORDER_STATE_TRANSITIONS[from] ?? [])
    .filter((t) => t.actor === actor)
    .map((t) => t.to);
}

/**
 * Narrow a raw string from the DB into an OrderState at runtime. Returns
 * undefined if the string isn't one of the defined states, so callers must
 * handle the unknown case explicitly rather than silently falling through.
 */
export function parseOrderState(raw: string): OrderState | undefined {
  return (ORDER_STATES as readonly string[]).includes(raw) ? (raw as OrderState) : undefined;
}
