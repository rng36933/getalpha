import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Everything is private by default. Only the sign-in and sign-up screens are
 * reachable without a session — an allowlist, so a route added later is
 * protected unless someone deliberately opens it.
 */
const isPublicRoute = createRouteMatcher(["/login(.*)", "/register(.*)"]);

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
