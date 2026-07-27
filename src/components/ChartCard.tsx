"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import PriceChart from "@/components/PriceChart";
import { dashboardCopy } from "@/lib/i18n/app/dashboard";
import type { Locale } from "@/lib/i18n/locales";
import type { Candle } from "@/lib/market-data/display";

/**
 * How often the chart asks for new bars.
 *
 * Sixty seconds regardless of timeframe, because the cost of asking is not what
 * it looks like: bars are cached on the server per `symbol@timeframe`, so a
 * hundred people watching XAUUSD M15 cost exactly what one person costs. Only
 * the first request after the cache goes stale reaches the provider — three
 * minutes on M15, an hour on W1 — and every poll in between is answered from
 * storage. Polling faster would not buy fresher data, only more requests.
 */
const REFRESH_MS = 60_000;

type Instrument = { symbol: string; label: string };

type ChartCardProps = {
  instruments: Instrument[];
  selectedSymbol: string;
  selectedLabel: string;
  timeframe: string;
  timeframes: { key: string; label: string }[];
  candles: Candle[];
  locale: Locale;
};

/**
 * The chart, with its own instrument and timeframe controls.
 *
 * Both live in the URL rather than in component state. The bars are fetched on
 * the server — a client-held selection would mean shipping the provider key to
 * the browser or adding a route that proxies it — and putting them in the query
 * string also makes a particular chart a link somebody can keep or share.
 */
export default function ChartCard({
  instruments,
  selectedSymbol,
  selectedLabel,
  timeframe,
  timeframes,
  candles,
  locale,
}: ChartCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const copy = dashboardCopy(locale).chart;

  const selection = `${selectedSymbol}@${timeframe}`;

  /**
   * The most recent refresh, tagged with the selection it belongs to.
   *
   * Tagged rather than reset in an effect. Copying props into state and syncing
   * them back is the cascading-render pattern the React compiler rejects, and
   * it is unnecessary here: which bars to draw is a question the render can
   * answer on its own. Switching instrument therefore shows the server's bars
   * for the new one immediately, instead of the previous instrument's until the
   * first poll lands.
   */
  const [fetched, setFetched] = useState<{
    selection: string;
    bars: Candle[];
    at: string;
  } | null>(null);

  const current = fetched?.selection === selection ? fetched : null;
  const bars = current?.bars ?? candles;
  const refreshedAt = current?.at ?? null;

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      // Nothing is worth fetching for a tab nobody is looking at. Without this,
      // every window left open overnight keeps asking until morning.
      if (document.visibilityState !== "visible") return;

      try {
        const params = new URLSearchParams({
          symbol: selectedSymbol,
          tf: timeframe,
        });
        const response = await fetch(`/api/candles?${params}`);
        if (!response.ok) return;

        const body: { candles?: Candle[] } = await response.json();
        if (cancelled || !Array.isArray(body.candles) || body.candles.length === 0) {
          return;
        }

        setFetched({
          selection,
          bars: body.candles,
          at: new Date().toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      } catch {
        // A failed refresh leaves the last good bars on screen. A chart that
        // empties itself because one request timed out is worse than a chart
        // that is a minute behind.
      }
    }

    const timer = setInterval(refresh, REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selection, selectedSymbol, timeframe]);

  function go(symbol: string, tf: string) {
    const params = new URLSearchParams({ symbol, tf });
    startTransition(() => router.push(`/dashboard?${params}`));
  }

  return (
    <section className="surface-lit rounded-xl border border-line p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="chart-instrument">
            {copy.instrumentLabel}
          </label>
          <select
            id="chart-instrument"
            value={selectedSymbol}
            disabled={pending || instruments.length === 0}
            onChange={(event) => go(event.target.value, timeframe)}
            className="rounded-lg border border-line bg-surface-raised px-2.5 py-1.5 text-sm font-medium outline-none focus:border-accent disabled:opacity-60"
          >
            {instruments.length === 0 ? (
              <option value={selectedSymbol}>{selectedLabel}</option>
            ) : (
              instruments.map((instrument) => (
                <option key={instrument.symbol} value={instrument.symbol}>
                  {instrument.label}
                </option>
              ))
            )}
          </select>

          {pending ? (
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
              {copy.loading}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1">
          {timeframes.map((option) => (
            <button
              key={option.key}
              type="button"
              disabled={pending}
              onClick={() => go(selectedSymbol, option.key)}
              aria-pressed={option.key === timeframe}
              className={`rounded-md px-2.5 py-1 font-mono text-xs transition-colors disabled:opacity-60 ${
                option.key === timeframe
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-4">
        {bars.length > 0 ? (
          // Keyed so switching timeframe rebuilds the chart rather than feeding
          // a series with different time units into the existing one. Within one
          // selection the chart is kept and only its bars are replaced, so a
          // refresh does not undo wherever the reader had panned to.
          <PriceChart
            key={`${selectedSymbol}-${timeframe}`}
            data={bars}
            height={300}
          />
        ) : (
          <p className="grid h-[300px] place-items-center text-center text-sm text-muted">
            {copy.noBars(timeframe, selectedLabel)}
          </p>
        )}
      </div>

      {/* Said out loud rather than implied. A chart that updates silently is a
          chart a trader cannot tell apart from a frozen one, and the honest
          answer is that this is a minute behind, not live. */}
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted">
        {refreshedAt ? copy.updated(refreshedAt) : copy.refreshesEveryMinute}
      </p>
    </section>
  );
}
