"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import PriceChart from "@/components/PriceChart";
import type { Candle } from "@/lib/market-data/display";

type Instrument = { symbol: string; label: string };

type ChartCardProps = {
  instruments: Instrument[];
  selectedSymbol: string;
  selectedLabel: string;
  timeframe: string;
  timeframes: { key: string; label: string }[];
  candles: Candle[];
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
}: ChartCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function go(symbol: string, tf: string) {
    const params = new URLSearchParams({ symbol, tf });
    startTransition(() => router.push(`/dashboard?${params}`));
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="chart-instrument">
            Instrument
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
              loading
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
        {candles.length > 0 ? (
          // Keyed so switching timeframe rebuilds the chart rather than feeding
          // a series with different time units into the existing one.
          <PriceChart
            key={`${selectedSymbol}-${timeframe}`}
            data={candles}
            height={300}
          />
        ) : (
          <p className="grid h-[300px] place-items-center text-center text-sm text-muted">
            No {timeframe} bars available for {selectedLabel} right now.
          </p>
        )}
      </div>
    </section>
  );
}
