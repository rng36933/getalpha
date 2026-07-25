import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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
const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/register(.*)",
  // Stripe has no Clerk session. The webhook authenticates itself with a
  // signature over the raw body instead.
  "/api/billing/webhook",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Everything except Next internals and static files.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // API routes are matched explicitly so they are never skipped.
    "/(api|trpc)(.*)",
  ],
};
