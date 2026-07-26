import Link from "next/link";

/**
 * What somebody sees on their first visit, before there is anything to show.
 *
 * The empty cards below it are honest but silent, and silence is the wrong
 * first impression for a product whose whole argument is where its numbers
 * come from. A new account arriving at six blank boxes assumes the app is
 * broken, or that it is another dashboard waiting to guess at the market.
 *
 * So the promise is stated plainly and immediately: every figure here is
 * computed from their own record, nothing is forecast, and the way to fill it
 * is one action away.
 */

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
  return (
    <section className="mb-4 rounded-xl border border-accent/30 bg-accent-soft p-5 sm:p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
        Nothing here yet
      </p>

      <h2 className="mt-2 text-lg font-semibold tracking-tight text-balance sm:text-xl">
        Every number on this desk is measured from your own trading.
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Not a forecast, not a signal, and not somebody else&rsquo;s backtest.
        This page stays empty until you record a trade, because there is nothing
        true to put in it before then — and a dashboard that fills itself with
        predictions is showing you guesses dressed as data.
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
