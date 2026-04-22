import "server-only";
import { env } from "@/env";
import * as Sentry from "@sentry/nextjs";

/**
 * Fixed-window rate limiter implemented against the Upstash Redis REST API.
 *
 * We deliberately do NOT depend on @upstash/ratelimit or @upstash/redis
 * here. Those packages are fine but every added dep costs lockfile churn
 * and cold-start weight on Vercel. The Upstash REST surface is small
 * enough to wrap directly with fetch.
 *
 * Semantics: for a given identifier (e.g. `"checkout:user_xyz"`), limit
 * the number of hits per `windowSec` seconds. Returns:
 *   { ok: true,  remaining, reset }  — request is allowed
 *   { ok: false, remaining: 0, reset } — request should be rejected
 *
 * Fallback behaviour: if UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 * aren't configured, the limiter becomes a permissive no-op. This is fine
 * for local dev and CI (no Redis available). In production the absence is
 * logged once via Sentry so we notice if a deploy forgot the credentials.
 *
 * Not a leak: the rate-limit state lives entirely server-side; callers
 * only see an HTTP 429 with a Retry-After header.
 */

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  reset: number; // unix ms when the window rolls over
  limit: number;
};

let warnedAboutMissingRedis = false;

function upstashConfigured(): boolean {
  return Boolean(
    env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN,
  );
}

/**
 * Single-command execution against the Upstash REST endpoint. Returns the
 * unparsed `result` field from the JSON response. Throws on non-2xx so
 * callers can decide whether to fail open or closed.
 */
async function upstashCmd(command: (string | number)[]): Promise<unknown> {
  const url = `${env.UPSTASH_REDIS_REST_URL}/${command
    .map((p) => encodeURIComponent(String(p)))
    .join("/")}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
    },
    // Vercel functions benefit from not caching rate-limit calls.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `Upstash REST ${command[0]} failed: ${res.status} ${await res.text()}`,
    );
  }

  const body = (await res.json()) as { result?: unknown; error?: string };
  if (body.error) throw new Error(`Upstash REST error: ${body.error}`);
  return body.result;
}

/**
 * rateLimit: increment the counter for `identifier` within a fixed window,
 * and report whether the caller is over `limit`.
 *
 * Fail-open policy: if Upstash is unreachable (network error, Upstash
 * outage), we capture the error and allow the request through. Rate
 * limits are a defence-in-depth layer — a transient Upstash outage should
 * not take down checkout.
 */
export async function rateLimit(
  identifier: string,
  opts: { limit: number; windowSec: number },
): Promise<RateLimitResult> {
  const { limit, windowSec } = opts;
  const now = Date.now();

  if (!upstashConfigured()) {
    if (
      process.env.NODE_ENV === "production" &&
      !warnedAboutMissingRedis
    ) {
      warnedAboutMissingRedis = true;
      Sentry.captureMessage(
        "Rate limiter running in no-op mode: UPSTASH_REDIS_REST_* not set",
        { level: "warning" },
      );
    }
    return {
      ok: true,
      remaining: limit,
      reset: now + windowSec * 1000,
      limit,
    };
  }

  const key = `ratelimit:${identifier}:${Math.floor(now / (windowSec * 1000))}`;
  const reset = (Math.floor(now / (windowSec * 1000)) + 1) * windowSec * 1000;

  try {
    const count = Number(await upstashCmd(["INCR", key]));
    if (count === 1) {
      // First hit in this window — set TTL so the key disappears on rollover.
      // Fire-and-forget; if EXPIRE fails the key just lives for the default
      // Redis max-idle, which is still bounded.
      void upstashCmd(["EXPIRE", key, windowSec]).catch((err) =>
        Sentry.captureException(err, {
          tags: { where: "rate_limit_expire" },
          extra: { key, windowSec },
        }),
      );
    }
    const remaining = Math.max(0, limit - count);
    return {
      ok: count <= limit,
      remaining,
      reset,
      limit,
    };
  } catch (err) {
    // Fail open — log and let the request proceed. Better to serve than to
    // 429 when our own Redis is the problem.
    Sentry.captureException(err, {
      tags: { where: "rate_limit_check" },
      extra: { identifier, limit, windowSec },
    });
    return { ok: true, remaining: limit, reset, limit };
  }
}

/**
 * Helper: pull the best identifier for a request. Prefers the authenticated
 * user id (caller-supplied), falls back to the CF-Connecting-IP / X-Forwarded-For
 * header, and finally to a shared bucket so at-least-some limiting fires
 * even on anonymous / ill-behaved clients.
 */
export function identifierFromRequest(
  req: Request,
  explicitUserId?: string | null,
): string {
  if (explicitUserId) return `u:${explicitUserId}`;
  const xff = req.headers.get("x-forwarded-for");
  const ip =
    req.headers.get("cf-connecting-ip") ??
    (xff ? xff.split(",")[0]!.trim() : null) ??
    req.headers.get("x-real-ip");
  if (ip) return `ip:${ip}`;
  return "anon:shared";
}

/**
 * Build a standard 429 response with correct Retry-After + RateLimit-* hints.
 */
export function tooManyRequests(result: RateLimitResult): Response {
  const retryAfterSec = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return new Response("Too Many Requests", {
    status: 429,
    headers: {
      "Retry-After": String(retryAfterSec),
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
    },
  });
}
