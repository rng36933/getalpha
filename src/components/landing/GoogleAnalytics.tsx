"use client";

import Script from "next/script";
import { useEffect } from "react";
import { gtagInit } from "@/lib/analytics/ga-client";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Google Analytics 4 tag — marketing pages only, never the app.
 *
 * lib/analytics runs no browser SDK on purpose: the authenticated app holds
 * entry prices, stop losses and account balances, and a third-party collector
 * there risks scraping them. The landing page, features and blog hold none of
 * that — they're the pitch, not the product — so a page-view tag is safe here
 * and nowhere past the login wall. Renders nothing when the env var is unset,
 * which is the default until a GA4 property exists.
 */
export default function GoogleAnalytics() {
  useEffect(() => {
    gtagInit();
  }, []);

  if (!GA_ID) return null;

  // Served from this origin (see next.config.ts's rewrite), not directly
  // from googletagmanager.com — most ad-blockers match by domain, and a
  // same-origin script survives blocklists a direct third-party request
  // never would.
  return <Script src={`/ga4/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />;
}
