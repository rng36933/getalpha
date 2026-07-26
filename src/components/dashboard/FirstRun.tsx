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

/**
 * Three lines, not three paragraphs.
 *
 * This banner used to run taller than a phone screen: somebody's first visit
 * meant scrolling past a screen and a half of explanation before reaching a
 * single number. The argument survives at a third of the length — and a wall of
 * text making the case for clarity was making the opposite case.
 */
const FACTS = [
  "Your win rate per pair — yours on gold against yours on GBPUSD.",
  "Where your losses cluster: the session, the weekday, the trade after a loss.",
  "What you actually risk, against your own median rather than a rule of thumb.",
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
    <section className="relative mb-4 rounded-xl border border-accent/30 bg-accent-soft p-4 pr-11 sm:p-5">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 rounded-md px-2 py-1 text-lg leading-none text-muted transition-colors hover:text-foreground"
      >
        ×
      </button>

      <h2 className="max-w-xl text-base font-semibold tracking-tight text-balance sm:text-lg">
        These cards stay empty until you record a trade.
      </h2>

      <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted">
        Every number here is measured from your own trading — never a forecast,
        a signal, or somebody else&rsquo;s backtest. Then you get:
      </p>

      <ul className="mt-3 flex flex-col gap-1.5">
        {FACTS.map((fact) => (
          <li
            key={fact}
            className="grid grid-cols-[0.9rem_1fr] gap-2 text-[13px] leading-snug text-muted"
          >
            <span aria-hidden="true" className="text-accent">
              →
            </span>
            <span>{fact}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href="/dashboard/journal"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-[filter] hover:brightness-110"
        >
          Record your first trade
        </Link>

        <span className="text-xs text-muted">
          Or sync MetaTrader in{" "}
          <Link href="/dashboard/settings" className="underline hover:text-foreground">
            Settings
          </Link>{" "}
          and it fills itself.
        </span>
      </div>
    </section>
  );
}
