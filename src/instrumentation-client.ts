// Sentry initialization for the browser. Next 15+/16 auto-loads this file
// when present (replaces the legacy sentry.client.config.ts path).
//
// The DSN ships to the client, which is fine — Sentry DSNs are designed to
// be public. Rate limiting and scrubbing happen server-side at Sentry.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.1",
    ),
    // Session replay is opt-in per-event via Sentry.replayIntegration() once
    // we've decided on the privacy policy for captured DOM. Leaving it out
    // here to avoid surprising anyone with full-session recording in prod.
    environment:
      process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    debug: false,
  });
}

// Router transition hook — lets Sentry attribute client-side navigation
// errors to the right route in the dashboard.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
