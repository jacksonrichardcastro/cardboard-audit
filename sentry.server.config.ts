// Sentry initialization for the Node.js server runtime (API routes, server
// actions, cron handlers). Loaded from src/instrumentation.ts#register when
// NEXT_RUNTIME === "nodejs".
//
// NEXT_PUBLIC_SENTRY_DSN is optional in the env schema — if it's absent,
// Sentry becomes a no-op, which is the desired behavior in local dev and CI.
// In production the DSN must be set; this file does NOT throw on a missing
// DSN because failing boot there would be worse than silent telemetry loss.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // tracesSampleRate at 10% gives useful perf data on prod traffic without
    // blowing up the Sentry quota. Tune via SENTRY_TRACES_SAMPLE_RATE if we
    // want a different ratio per environment.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
    // Tag every event with the Vercel environment so dashboards can split
    // production vs preview.
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    // Strip non-essential default integrations we don't need server-side to
    // keep the cold-start footprint small. Keep HTTP + OnUnhandledRejection +
    // OnUncaughtException which come bundled.
    debug: false,
    // We send our own context via captureException extras in webhook and
    // cron code — leave beforeSend to default so those extras flow through.
  });
}
