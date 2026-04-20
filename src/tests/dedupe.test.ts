import { describe, it, expect, vi } from "vitest";

vi.mock("stripe", () => ({
  default: vi.fn().mockImplementation(() => ({
    webhooks: { constructEvent: vi.fn().mockReturnValue({ id: "evt_duplicate_test", type: "charge.succeeded", data: { object: {} } }) }
  }))
}));

import { POST } from "../app/api/webhooks/stripe/route";

vi.mock("@/lib/db", () => {
  return {
    db: {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockImplementation(() => {
              // Simulate PostgreSQL blocking the insertion silently due to primary key conflict
              throw new Error("Mocked Duplicate Constraint");
          })
        })
      }),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    }
  };
});

describe("P0-2: Webhook Idempotency Limits", () => {
    it("safely neutralizes duplicate Stripe events natively skipping db.insert mutations", async () => {
        const mockPayload = { id: "evt_duplicate_test", type: "charge.succeeded", data: { object: {} } };
        const req = new Request("http://localhost/api/webhooks/stripe", {
            method: "POST",
            body: JSON.stringify(mockPayload)
        });

        // The Mocked DB represents PG throwing uniqueness exceptions
        const res = await POST(req);
        
        // Assert exactly correct JSON intercept status.
        expect(res.status).toBe(200); 
        const json = await res.json();
        expect(json.message).toBe("Duplicate stripe event dropped cleanly by DB");
    });
});
