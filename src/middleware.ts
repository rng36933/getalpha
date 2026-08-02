import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PUBLIC_ROUTES } from "@/lib/public-routes";
import {
  REFERRAL_CODE_PATTERN,
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_MAX_AGE,
} from "@/lib/referral/cookie";

/**
 * Next 16 deprecates this file convention in favour of `proxy.ts`, and the
 * build prints a warning about it. Renaming the file took the whole site down
 * with MIDDLEWARE_INVOCATION_FAILED on Vercel — Clerk exports no `clerkProxy`
 * counterpart and `clerkMiddleware` did not survive the move. The warning
 * stays until Clerk supports the new convention.
 *
 * Everything is private by default. Only the sign-in and sign-up screens are
 * reachable without a session — an allowlist, so a route added later is
 * protected unless someone deliberately opens it.
 */
const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTES]);

/**
 * Content-Security-Policy, generated per request rather than in
 * `next.config.ts`'s static `headers()` because it needs a fresh nonce every
 * time — a hardcoded one would just be a public password for `script-src`.
 *
 * `strict-dynamic` is what makes this viable at all: Next's own bootstrap
 * script carries the nonce, and everything that script goes on to load
 * (Next's chunks, Clerk's client bundle) inherits that trust regardless of
 * origin. Without it, every third-party script host would need listing here
 * by hand and would break the moment one of them changed a CDN URL.
 *
 * `strict-dynamic` only covers scripts, so Clerk's own network calls, its
 * avatar images and its bot-check iframe still need explicit origins below.
 * Stripe never appears here — checkout is a redirect to Stripe's own hosted
 * page, never an embedded script — and neither does PostHog, which only runs
 * server-side (see `src/lib/analytics/index.ts`). Sentry's browser reports
 * go out through `/monitoring`, this app's own origin, for the same reason.
 */
function buildCsp(nonce: string): string {
  // React's development build calls eval() for its debugging tools and never
  // does in production, so the looser script-src only applies locally —
  // shipping it in prod would undo most of the point of this policy.
  const scriptSrc =
    process.env.NODE_ENV === "production"
      ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
      : `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`;

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data: https://img.clerk.com`,
    `font-src 'self'`,
    `connect-src 'self' https://*.clerk.accounts.dev https://clerk-telemetry.com`,
    `frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com`,
    `worker-src 'self' blob:`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Passed to the request, not just the response: Next reads the nonce back
  // off the incoming request headers to stamp it onto the scripts it renders
  // for this same request, so the value has to be visible before that render
  // happens, not only on the way out.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);

  // An invite code arrives on the landing page but is only usable after the
  // visitor has signed up, which happens on Clerk's pages. The cookie is what
  // carries it across that gap. Set here rather than on the page so it survives
  // whichever route the link points at.
  const ref = request.nextUrl.searchParams.get("ref")?.toUpperCase();

  if (
    ref &&
    REFERRAL_CODE_PATTERN.test(ref) &&
    !request.cookies.has(REFERRAL_COOKIE)
  ) {
    // Not `httpOnly: false` — nothing in the browser needs to read it, and
    // `lax` is enough for a code that only ever arrives by following a link.
    response.cookies.set(REFERRAL_COOKIE, ref, {
      maxAge: REFERRAL_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return response;
});

/**
 * Written out as literals, not built from `MIDDLEWARE_MATCHER`.
 *
 * Next parses this object at compile time and rejects anything it cannot read
 * statically — an imported value fails the build with "needs to have a very
 * specific format". The shared constant still exists, and
 * `tests/public-surfaces.test.ts` asserts these two strings are exactly what it
 * generates, so the duplication cannot drift silently.
 */
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|mq5|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
