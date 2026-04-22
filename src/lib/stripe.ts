import "server-only";
import Stripe from "stripe";
import { env } from "@/env";

/**
 * Single shared Stripe client for all server-side code.
 *
 * API version is pinned to a known-good value for stripe-node ^22.0.2. Do
 * not instantiate `new Stripe(...)` elsewhere — import this instance so
 * that every call (checkout session creation, webhook construction, Connect
 * account creation, transfers) uses the same contract. Previously, the
 * connect route used "2026-03-25.dahlia" (future-dated, not valid on the
 * installed SDK) while the checkout route used "2023-10-16"; that mismatch
 * meant checkout and connect could diverge silently on breaking changes.
 *
 * When bumping the SDK, bump the apiVersion in lockstep and review the
 * Stripe changelog for any Connect / Checkout / Webhooks breaks.
 */
// stripe-node ^22 expects a specific apiVersion literal; using `as any` to
// keep compatibility with the SDK type without hard-pinning to its exact
// current literal (which changes as Stripe rev's). Bump this intentionally
// alongside SDK bumps and run the webhook/checkout integration tests.
export const STRIPE_API_VERSION = "2024-06-20" as const;

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION as any,
  typescript: true,
  appInfo: {
    name: "cardbound",
    version: "0.1.0",
  },
});
