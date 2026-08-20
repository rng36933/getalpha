"use client";

/**
 * The browser-side counterpart to lib/analytics — Google Analytics 4, not
 * PostHog, and deliberately confined to the marketing surface (see
 * GoogleAnalytics.tsx for why). Manual events only, same discipline as the
 * server-side client: nothing here autocaptures a click target or a form
 * value, only the named event this file is asked to send.
 *
 * The gtag shim is defined here, synchronously, rather than left to whenever
 * the injected <Script> tag happens to run — a CTA on the same page can be
 * clicked before that script executes, and a call to `gtag()` before the shim
 * exists is silently lost, not queued.
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function ensureGtag(): (...args: unknown[]) => void {
  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args: unknown[]) => {
      window.dataLayer.push(args);
    };
  }
  return window.gtag;
}

/** Called once by <GoogleAnalytics /> to start the tag. */
export function gtagInit(): void {
  if (typeof window === "undefined" || !GA_ID) return;
  const gtag = ensureGtag();
  // Google's Consent Mode treats EEA traffic (Lithuania included) as
  // consent-required by default: without an explicit "default" signal,
  // gtag.js silently drops the /g/collect beacon instead of sending it —
  // confirmed 2026-08-20 as the real cause of GA4 showing zero data for
  // days despite the transport_url proxy working correctly end to end.
  // No ads run on this product, so ad_storage/ad_user_data/ad_personalization
  // stay denied; analytics_storage is granted by default (no cookie banner
  // exists yet — an explicit product decision, not an oversight).
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "granted",
  });
  gtag("js", new Date());
  // transport_url routes hits through this origin's /ga4/g/collect rewrite
  // (next.config.ts) instead of google-analytics.com directly — the same
  // domain-based ad-blockers that were silently eating every hit (confirmed
  // 2026-08-19: GA showed zero for 48h of real traffic the site's own
  // counter logged) can't match a same-origin request the way they match a
  // known tracker domain.
  gtag("config", GA_ID, { transport_url: window.location.origin + "/ga4" });
}

/** Fires a GA4 event. A no-op wherever no GA4 property is configured. */
export function gtagEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !GA_ID) return;
  const gtag = ensureGtag();
  gtag("event", name, params);
}
