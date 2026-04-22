// Sentry initialization for the Edge runtime (middleware + any route that
// sets `export const runtime = "edge"`). Loaded from src/instrumentation.ts
// #register when NEXT_RUNTIME === "edge".
//
// The edge runtime has a smaller API surface than Node, so we keep this
// config minimal and explicitly avoid integrations that only work in Node.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    debug: false,
  });
}
