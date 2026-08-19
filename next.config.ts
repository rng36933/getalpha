import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

/**
 * Headers every response carries.
 *
 * The deployment shipped with `Strict-Transport-Security` and nothing else,
 * which left the obvious ones missing: the site could be framed by any other
 * origin, and a response could be re-interpreted as a type it never claimed.
 * Neither is exotic and both are one line.
 *
 * Deliberately no `Content-Security-Policy` here. A real one for this app has
 * to admit Clerk, Stripe, PostHog and Sentry, and Next's inline bootstrap needs
 * a nonce — written blind it either breaks sign-in or is loose enough to be
 * decoration. Worth doing properly and separately rather than guessing at now.
 */
const SECURITY_HEADERS = [
  // Nothing here is meant to be framed, and a journal showing account balances
  // is exactly what a clickjacking overlay wants underneath it.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // The path can carry a trade id; other origins get the bare origin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // None of these are used, so nothing embedded here can reach for them.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  devIndicators: {
    // Defaults to bottom-left, where it sits on top of the sidebar's account
    // button. Development only — it is never rendered in production.
    position: "bottom-right",
  },

  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },

  // First-party proxy for GA4, same reasoning as Sentry's tunnelRoute below:
  // most ad-blockers match by domain (googletagmanager.com,
  // google-analytics.com), not by path, so serving the library and sending
  // hits from this site's own origin survives blocklists that a direct
  // third-party request never would. Confirmed necessary 2026-08-19 — GA's
  // own Data Streams admin showed "No data received in past 48 hours" while
  // the site's self-hosted visit counter logged 78 real visitors in the same
  // window; gtag.js loaded and queued a config command correctly, so the
  // client code was never the bug, only the direct third-party request was.
  async rewrites() {
    return [
      { source: "/ga4/gtag/js", destination: "https://www.googletagmanager.com/gtag/js" },
      { source: "/ga4/g/collect", destination: "https://www.google-analytics.com/g/collect" },
    ];
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
