import { describe, it, expect, vi } from "vitest";
import crypto from "node:crypto";

/**
 * HMAC boundary tests for the Shippo (carrier) webhook.
 *
 * The rewritten route uses crypto.timingSafeEqual and collapses the
 * "missing" and "invalid" cases into a single 401 "Invalid Signature"
 * response body — the response shape must not help an attacker
 * distinguish between those two states.
 */

vi.mock("@/env", () => ({
  env: {
    CARRIER_WEBHOOK_SECRET: "mock_secret",
    STRIPE_SECRET_KEY: "sk_test_mock",
    STRIPE_WEBHOOK_SECRET: "whsec_test_mock",
  },
}));

// Don't let the route hit any real DB; we only exercise the HMAC branch
// and the malformed-payload branch here.
vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    delete: vi.fn(),
  },
  withUserContext: vi.fn(),
}));

import { POST } from "../app/api/webhooks/shipping/route";

function sign(body: string, secret = "mock_secret"): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("P0-1: Shipping webhook HMAC boundaries", () => {
  it("rejects with 401 when the signature header is entirely absent", async () => {
    const req = new Request("http://localhost:3000/api/webhooks/shipping", {
      method: "POST",
      body: JSON.stringify({ event: "track_updated", data: {} }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(await res.text()).toBe("Invalid Signature");
  });

  it("rejects with 401 when the signature is present but wrong", async () => {
    const req = new Request("http://localhost:3000/api/webhooks/shipping", {
      method: "POST",
      headers: { "x-shippo-signature": "deadbeef" },
      body: JSON.stringify({ event: "track_updated", data: {} }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(await res.text()).toBe("Invalid Signature");
  });

  it("rejects with 401 when the signature length is close but different byte values", async () => {
    const body = JSON.stringify({ event: "track_updated", data: {} });
    const correct = sign(body);
    // Flip one hex character so the buffer is the same length but differs in
    // exactly one byte — exercises timingSafeEqual's constant-time compare.
    const tampered = correct.slice(0, -1) + (correct.slice(-1) === "a" ? "b" : "a");
    const req = new Request("http://localhost:3000/api/webhooks/shipping", {
      method: "POST",
      headers: { "x-shippo-signature": tampered },
      body,
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(await res.text()).toBe("Invalid Signature");
  });

  it("accepts a correctly-signed payload (but rejects non-track_updated events with 'ignored')", async () => {
    // event != track_updated → route acks 200 with status 'ignored', which is
    // enough to prove the HMAC branch passed without requiring DB setup.
    const body = JSON.stringify({ event: "transaction_updated", data: {} });
    const sig = sign(body);
    const req = new Request("http://localhost:3000/api/webhooks/shipping", {
      method: "POST",
      headers: { "x-shippo-signature": sig },
      body,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { status: string };
    expect(json.status).toBe("ignored");
  });
});
