import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Sentry adds tunnelRoute + error boundary overlay; no other Next config
  // needed for Sentry wiring itself.
};

// Sentry build-time config. `silent: !CI` keeps local builds quiet while
// still letting the Vercel/GitHub Actions build log Sentry upload progress.
// SENTRY_ORG / SENTRY_PROJECT / SENTRY_AUTH_TOKEN are read from env by the
// plugin directly — they're optional in our env schema so builds succeed
// without them; sourcemap upload is just skipped in that case.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Don't fail the build if sourcemap upload fails — telemetry loss is
  // cheaper than a failed production deploy.
  errorHandler: (err) => {
    // eslint-disable-next-line no-console
    console.warn("[sentry] sourcemap upload warning:", err?.message ?? err);
  },
  // Hide sourcemaps from public output once uploaded to Sentry.
  hideSourceMaps: true,
  // Suppress the "missing global error handler" warning if we haven't
  // added global-error.tsx yet — we'll add it when we wire the UI layer.
  disableLogger: true,
  // Upload additional files Next bundles into .next/ outputs.
  widenClientFileUpload: true,
});
