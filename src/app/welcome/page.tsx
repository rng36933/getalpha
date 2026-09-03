"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import GoogleAnalytics from "@/components/landing/GoogleAnalytics";
import { gtagEvent } from "@/lib/analytics/ga-client";

/**
 * A one-frame relay between Clerk finishing sign-up and the dashboard.
 *
 * The GA4 tag never runs inside the authenticated app (see GoogleAnalytics.tsx),
 * so the one event ad platforms actually care about — a completed sign-up —
 * has nowhere to fire from if Clerk redirects straight to /dashboard. This page
 * exists only to fire it once and hand off immediately; nothing here reads or
 * shows account data.
 *
 * Navigation is deliberately held until the hit is confirmed sent (or times
 * out) rather than firing gtagEvent and calling router.replace in the same
 * tick — confirmed 2026-09-02 that the immediate-navigate version silently
 * dropped the sign_up event every time: <GoogleAnalytics />'s <Script> tag
 * (~500KB) is still mid-download when this page would otherwise unmount, and
 * removing an in-flight <script src> from the DOM aborts that fetch, so
 * gtag.js never finishes loading and never processes anything queued for it.
 * event_callback/event_timeout are gtag.js's own documented mechanism for
 * exactly this "track then redirect" shape; the setTimeout is a second-layer
 * fallback for when GA4 isn't configured at all (gtagEvent no-ops, so
 * event_callback never fires) — this page must never strand a user.
 */
export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    let navigated = false;
    const goToDashboard = () => {
      if (navigated) return;
      navigated = true;
      router.replace("/dashboard");
    };

    gtagEvent("sign_up", {
      event_callback: goToDashboard,
      event_timeout: 1000,
    });

    const fallback = setTimeout(goToDashboard, 1200);
    return () => clearTimeout(fallback);
  }, [router]);

  return (
    <>
      <GoogleAnalytics />
      <div className="flex min-h-full items-center justify-center bg-background text-sm text-muted">
        Setting up your journal…
      </div>
    </>
  );
}
