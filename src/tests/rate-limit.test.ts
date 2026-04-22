import { describe, it, expect, vi } from "vitest";

/**
 * Rate-limiter fallback behaviour.
 *
 * In CI (and in local dev without Upstash creds) the limiter is expected
 * to be a permissive no-op: every call returns ok=true and the request
 * remains the full `limit`. This test locks that in so we don't
 * accidentally ship a limiter that fails closed when Upstash is absent
 * (which would silently 429 every request under that configuration).
 */

vi.mock("@/env", () => ({
  env: {
    UPSTASH_REDIS_REST_URL: undefined,
    UPSTASH_REDIS_REST_TOKEN: undefined,
    STRIPE_SECRET_KEY: "sk_test_mock",
  },
}));

vi.mock("@sentry/nextjs", () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));

import { rateLimit, identifierFromRequest } from "@/lib/rate-limit";

describe("rate-limit: Upstash-not-configured fallback", () => {
  it("returns ok=true every call when Upstash creds are missing", async () => {
    const result = await rateLimit("test-no-upstash", {
      limit: 5,
      windowSec: 60,
    });
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(5);
    expect(result.limit).toBe(5);
  });

  it("still returns ok=true on the hundredth consecutive call in fallback mode", async () => {
    for (let i = 0; i < 100; i++) {
      const result = await rateLimit("spam-no-upstash", {
        limit: 5,
        windowSec: 60,
      });
      expect(result.ok).toBe(true);
    }
  });
});

describe("rate-limit: identifierFromRequest", () => {
  it("prefers the explicit user id over header-derived IPs", () => {
    const req = new Request("http://localhost/test", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    expect(identifierFromRequest(req, "user_abc")).toBe("u:user_abc");
  });

  it("falls back to cf-connecting-ip when no explicit user id is given", () => {
    const req = new Request("http://localhost/test", {
      headers: { "cf-connecting-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1" },
    });
    expect(identifierFromRequest(req)).toBe("ip:9.9.9.9");
  });

  it("falls back to the first entry in x-forwarded-for when cf-connecting-ip absent", () => {
    const req = new Request("http://localhost/test", {
      headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" },
    });
    expect(identifierFromRequest(req)).toBe("ip:1.1.1.1");
  });

  it("falls back to a shared anon bucket when no identifying info is available", () => {
    const req = new Request("http://localhost/test");
    expect(identifierFromRequest(req)).toBe("anon:shared");
  });
});
