"use client";

import { useEffect } from "react";

/**
 * Fires one fire-and-forget page-view ping on mount.
 *
 * Renders nothing. Placed only on public marketing pages — never inside the
 * authenticated app, which has its own separate reason not to send anything
 * to a third party (see lib/analytics).
 */
export default function VisitTracker() {
  useEffect(() => {
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
      keepalive: true,
    }).catch(() => {
      // A missed page view is not worth surfacing to the visitor.
    });
  }, []);

  return null;
}
