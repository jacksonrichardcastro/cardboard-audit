import { describe, it, expect, vi } from "vitest";

vi.mock("@/env", () => ({
  env: { CARRIER_WEBHOOK_SECRET: "mock_secret", STRIPE_SECRET_KEY: "sk_test_mock" }
}));

import { POST } from "../app/api/webhooks/shipping/route";

describe("P0-1: Shipping Webhook HMAC Boundaries", () => {
  it("rejects payload entirely if x-carrier-signature header is absent", async () => {
    // Construct mock request without signature headers
    const req = new Request("http://localhost:3000/api/webhooks/shipping", {
      method: "POST",
      body: JSON.stringify({ tracking: "123", status: "delivered" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(await res.text()).toBe("Missing Signature");
  });

  it("rejects payload entirely if x-carrier-signature header is invalid", async () => {
    // Construct mock request with explicitly hostile/invalid signature
    const req = new Request("http://localhost:3000/api/webhooks/shipping", {
      method: "POST",
      headers: { "x-carrier-signature": "invalid_spoofed_signature" },
      body: JSON.stringify({ tracking: "123", status: "delivered" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(await res.text()).toBe("Invalid Signature");
  });
});
