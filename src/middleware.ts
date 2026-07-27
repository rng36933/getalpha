import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  suggestLocale,
} from "@/lib/i18n/locales";
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

  const existingLocaleCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const suggestedLocale = suggestLocale({
    cookie: existingLocaleCookie,
    country: request.headers.get("x-vercel-ip-country"),
  });

  // A visitor from Lithuania is *offered* the Lithuanian landing page, once.
  //
  // Deliberately narrow: only the bare landing page, only as a redirect to a
  // real URL, never a content swap at `/` itself. Two things follow from doing
  // it this way:
  //
  // - Googlebot crawls from the United States, so it is never redirected and
  //   `/` stays the English page it indexes. `/lt` it reaches directly.
  // - The header is absent locally and can be absent at the edge, and
  //   `suggestLocale` treats absence as "leave them alone" rather than a hint,
  //   so nothing here redirects on a guess it cannot make.
  //
  // The signed-in app is not indexed by anyone, so it has no matching reason to
  // fork every dashboard route into an `/lt` twin — it reads the same cookie
  // set below and swaps its own copy without moving the URL at all.
  if (request.nextUrl.pathname === "/" && suggestedLocale === "lt") {
    const target = request.nextUrl.clone();
    target.pathname = "/lt";

    // 307, not 308: this is a suggestion about a reader, not a statement that
    // the page has moved. A permanent redirect would be cached by the browser
    // and would survive them choosing English, which is the one thing the
    // switcher must always be able to undo.
    const redirect = NextResponse.redirect(target, 307);

    if (!existingLocaleCookie) {
      redirect.cookies.set(LOCALE_COOKIE, suggestedLocale, {
        maxAge: LOCALE_COOKIE_MAX_AGE,
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    return redirect;
  }

  const response = NextResponse.next();

  // Written once, on whichever page a visitor happens to land on first —
  // there is no single "front door" a signed-in dashboard user is guaranteed
  // to pass through, unlike the landing page's `/`. Without this, someone who
  // bookmarks straight into `/dashboard` and never once loads `/` would carry
  // no cookie at all, and every dashboard page would have to fall back to
  // guessing the country itself instead of reading one settled answer.
  //
  // Skipped for API routes: a fetch call gains nothing from a cookie meant for
  // the next page render, and setting one on every `/api/mt5/sync` ping from a
  // terminal would be cookie churn with no reader to benefit from it.
  if (!existingLocaleCookie && !request.nextUrl.pathname.startsWith("/api")) {
    response.cookies.set(LOCALE_COOKIE, suggestedLocale, {
      // Not httpOnly: the client-side language switcher writes this same
      // cookie directly from the browser, so the server setting it httpOnly
      // would make the two inconsistent about who is allowed to change it.
      httpOnly: false,
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

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
