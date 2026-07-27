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

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  const response = NextResponse.next();

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
