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
 */
export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    gtagEvent("sign_up");
    router.replace("/dashboard");
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
