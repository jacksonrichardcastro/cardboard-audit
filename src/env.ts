import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Build-time-validated environment variables. Any missing or malformed
 * value here fails the Next.js build instead of exploding at runtime on
 * the first request that reaches the missing var.
 *
 * When adding a new variable:
 *  - server-only secrets go under `server`
 *  - anything that needs to reach the browser goes under `client` with the
 *    `NEXT_PUBLIC_` prefix, and must also be listed in
 *    experimental__runtimeEnv so Next.js bundles it
 */
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),

    // Stripe
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),

    // Carrier (Shippo) webhook
    CARRIER_WEBHOOK_SECRET: z.string().min(1),

    // Supabase (service-role for server-side Supabase calls; primarily for
    // storage uploads at present)
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

    // Email (Resend) — server-side only
    RESEND_API_KEY: z.string().min(1),

    // Clerk
    CLERK_SECRET_KEY: z.string().min(1),

    // Cron auth — shared secret used by Vercel Cron / GitHub Actions to
    // invoke the payout-sweeper and any other maintenance endpoints.
    // Previously read via raw process.env at call sites; lifting it here
    // means a missing value fails the build.
    CRON_SECRET: z.string().min(16, "CRON_SECRET must be at least 16 chars"),

    // Sentry server-side. SENTRY_AUTH_TOKEN is only needed in CI/CD for
    // sourcemap upload; we do not require it at runtime.
    SENTRY_AUTH_TOKEN: z.string().optional(),
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),

    // Upstash Redis (rate limiting). Optional in CI; if unset, the rate
    // limiter falls back to an in-memory no-op so tests and local dev work
    // without a Redis. Required in production environments — see
    // lib/rate-limit.ts for the runtime check.
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    // Sentry browser DSN. Optional — if unset, browser Sentry is a no-op.
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
  // In tests and CI we skip the full env validation so fixtures without
  // production secrets can still import this module. The CI workflow sets
  // the real values in env:.
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
