import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Idempotency test for the Stripe webhook.
 *
 * The previous version of this test expected a specific error message from
 * an onConflictDoNothing catch block — a behaviour that existed in the
 * old (buggy) webhook code. onConflictDoNothing does NOT throw on a
 * duplicate; it silently returns zero rows. The rewritten route uses
 * `.returning({ id })` and checks `claimed.length === 0` to detect the
 * duplicate.
 *
 * This test exercises both branches of that check:
 *  1. First delivery of an event id — insert returns a row, route runs
 *     the handler, responds 200.
 *  2. Second delivery of the same event id — insert returns [], route
 *     short-circuits with `duplicate_ignored`.
 */

const baseEvent = {
  id: "evt_duplicate_test",
  type: "identity.verification_session.verified",
  data: { object: { metadata: { userId: "user_test" } } },
};

vi.mock("stripe", () => ({
  default: class StripeMock {
    webhooks = {
      constructEvent: vi.fn().mockReturnValue(baseEvent),
    };
  },
}));

vi.mock("@/env", () => ({
  env: {
    STRIPE_SECRET_KEY: "sk_test_mock",
    STRIPE_WEBHOOK_SECRET: "whsec_test_mock",
  },
}));

// Drizzle chain helper: the insert(...).values(...).onConflictDoNothing().returning() shape.
function buildInsertChain(returningRows: Array<{ id: string }>) {
  const returning = vi.fn().mockResolvedValue(returningRows);
  const onConflictDoNothing = vi.fn().mockReturnValue({ returning });
  const values = vi.fn().mockReturnValue({ onConflictDoNothing });
  const insert = vi.fn().mockReturnValue({ values });
  return { insert, values, onConflictDoNothing, returning };
}

// Chain for the update call used by the identity.verified branch:
// db.update(sellers).set(...).where(...). We don't care about the result.
function buildUpdateChain() {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn().mockReturnValue({ where });
  const update = vi.fn().mockReturnValue({ set });
  return { update, set, where };
}

vi.mock("@/lib/db", () => {
  // First call: insert into webhookEvents. Second call: update sellers.
  // We swap the insert mock per-test via (globalThis as any).__dbInsert.
  const updateChain = buildUpdateChain();
  return {
    db: {
      // lazy — resolved at call time
      insert: (...args: any[]) => (globalThis as any).__dbInsert(...args),
      update: updateChain.update,
      delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    },
    withUserContext: vi.fn(),
  };
});

describe("P0-2: Stripe webhook idempotency (returning-based claim)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("first delivery: inserts claim row, returns 200", async () => {
    const { insert } = buildInsertChain([{ id: baseEvent.id }]);
    (globalThis as any).__dbInsert = insert;

    const { POST } = await import("../app/api/webhooks/stripe/route");
    const req = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify(baseEvent),
      headers: { "stripe-signature": "whsec_mock" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(insert).toHaveBeenCalled();
  });

  it("duplicate delivery: claim returns empty row-set, response is duplicate_ignored 200", async () => {
    const { insert } = buildInsertChain([]); // simulates conflict
    (globalThis as any).__dbInsert = insert;

    const { POST } = await import("../app/api/webhooks/stripe/route");
    const req = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify(baseEvent),
      headers: { "stripe-signature": "whsec_mock" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { status: string; eventId: string };
    expect(json.status).toBe("duplicate_ignored");
    expect(json.eventId).toBe(baseEvent.id);
  });
});
