// Next.js instrumentation hook. Next calls `register()` once per runtime
// (server, edge) at process start, before any request is served. We use it
// to bootstrap Sentry for the matching runtime.
//
// Also exports `onRequestError` which Next calls whenever a server-side
// render throws — captureRequestError threads the request context into the
// Sentry event so the dashboard shows the offending URL/method/headers.
//
// See https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
