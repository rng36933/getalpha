import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    // Defaults to bottom-left, where it sits on top of the sidebar's account
    // button. Development only — it is never rendered in production.
    position: "bottom-right",
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Source maps are uploaded only when a token is present, so a build without
  // one — CI, a fresh clone — succeeds instead of failing on a missing secret.
  silent: !process.env.CI,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Uploaded, then deleted from the output. Leaving them served would publish
  // the original source of every server route to anyone who asked for it.
  sourcemaps: { deleteSourcemapsAfterUpload: true },

  // Routes the browser SDK through the app's own origin, so an ad blocker
  // does not silently discard every client-side report.
  tunnelRoute: "/monitoring",
});
