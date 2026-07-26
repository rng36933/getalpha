"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

/**
 * What somebody sees on their first visit, before there is anything to show.
 *
 * The empty cards below it are honest but silent, and silence is the wrong
 * first impression for a product whose whole argument is where its numbers
 * come from. A new account arriving at blank boxes assumes the app is broken,
 * or that it is another dashboard waiting to guess at the market.
 *
 * Dismissible, and it stays dismissed. Somebody who has read it once and is
 * still working through their first trade should not be told again on every
 * page load.
 */

const STORAGE_KEY = "getalpha.firstRun.dismissed";

const noSubscribe = () => () => {};

/** False on the server and during the first client render, true afterwards. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
}

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Private browsing and blocked storage both throw. Showing the banner is
    // the safer failure: it can be closed again.
    return false;
  }
}

const FACTS = [
  {
    title: "Your win rate, per pair",
    body: "Not a general statistic. Yours on GBPUSD against yours on gold, from the trades you recorded.",
  },
  {
    title: "Where your losses cluster",
    body: "The session, the weekday, the trade straight after a loss. Patterns nobody spots in their own record by reading it.",
  },
  {
    title: "What you actually risk",
    body: "Risk per trade against your own median, and how often a trade went on with no stop at all.",
  },
];

export default function FirstRun() {
  const hydrated = useHydrated();
  const [dismissed, setDismissed] = useState(false);

  // Nothing is rendered on the server. A banner that appears and then vanishes
  // for somebody who already closed it is worse than one that arrives a moment
  // late.
  if (!hydrated || dismissed || wasDismissed()) return null;

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Closed for this view either way.
    }
  }

  return (
    <section className="relative mb-4 rounded-xl border border-accent/30 bg-accent-soft p-5 sm:p-6">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 rounded-md px-2 py-1 text-lg leading-none text-muted transition-colors hover:text-foreground"
      >
        ×
      </button>

      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
        How this desk works
      </p>

      <h2 className="mt-2 max-w-2xl text-lg font-semibold tracking-tight text-balance sm:text-xl">
        Every number here is measured from your own trading.
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Not a forecast, not a signal, and not somebody else&rsquo;s backtest.
        These cards stay empty until you record a trade, because there is
        nothing true to put in them before then — and a dashboard that fills
        itself with predictions is showing you guesses dressed as data.
      </p>

      <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FACTS.map((fact) => (
          <div key={fact.title} className="border-t border-accent/20 pt-3">
            <dt className="text-sm font-medium">{fact.title}</dt>
            <dd className="mt-1 text-[13px] leading-relaxed text-muted">
              {fact.body}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Link
          href="/dashboard/journal"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-[filter] hover:brightness-110"
        >
          Record your first trade
        </Link>

        <span className="text-xs text-muted">
          Takes about a minute. The R-multiple is computed, never typed.
        </span>
      </div>
    </section>
  );
}
