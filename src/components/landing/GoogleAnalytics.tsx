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
  // never would. The path itself is an unguessable hash, not "/gtag/js" —
  // filter lists match that literal path fragment regardless of domain,
  // which was quietly eating every hit until 2026-08-26 (see next.config.ts).
  return <Script src={`/a3f7e91c2b6d4085/init.js?id=${GA_ID}`} strategy="afterInteractive" />;
}
