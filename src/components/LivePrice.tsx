"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The session price, re-polled so it can flash when it actually moves.
 *
 * Reuses `/api/candles` rather than a dedicated endpoint — it already
 * returns the freshest bar for a symbol the caller watches, cached the same
 * way the chart's own poll is. A price that never visibly ticks reads as a
 * static number rather than a market; the flash is the difference.
 *
 * Silent on failure by design: a symbol not on the caller's watchlist (the
 * default instrument can be shown even when it isn't watched) or a rate
 * limit both fail the fetch, and the right response to either is to keep
 * showing the last known price, not to break the card over it.
 */
export default function LivePrice({
  symbol,
  timeframe,
  initialPrice,
  className = "",
}: {
  symbol: string;
  timeframe: string;
  initialPrice: number;
  className?: string;
}) {
  // Decimals inferred from the server-rendered price rather than
  // hard-coded, so a two-decimal FX pair and a gold price with more
  // precision both keep the exact formatting the server chose.
  const decimals = (() => {
    const text = initialPrice.toString();
    const dot = text.indexOf(".");
    return dot === -1 ? 0 : text.length - dot - 1;
  })();

  const [price, setPrice] = useState(initialPrice);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const lastPrice = useRef(initialPrice);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      // A tab nobody is looking at is not worth the request.
      if (document.visibilityState !== "visible") return;

      try {
        const params = new URLSearchParams({ symbol, tf: timeframe });
        const response = await fetch(`/api/candles?${params}`);
        if (!response.ok) return;

        const body: { candles?: { close: number }[] } = await response.json();
        if (cancelled || !Array.isArray(body.candles) || body.candles.length === 0) {
          return;
        }

        const latest = body.candles[body.candles.length - 1].close;
        if (latest === lastPrice.current) return;

        setFlash(latest > lastPrice.current ? "up" : "down");
        lastPrice.current = latest;
        setPrice(latest);

        if (flashTimer.current) clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setFlash(null), 700);
      } catch {
        // Last known price stays on screen; see the module comment.
      }
    }

    const timer = setInterval(poll, 30_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, [symbol, timeframe]);

  return (
    <span
      className={`transition-colors duration-300 ${
        flash === "up"
          ? "text-positive"
          : flash === "down"
            ? "text-negative"
            : ""
      } ${className}`}
    >
      {price.toFixed(decimals)}
    </span>
  );
}
