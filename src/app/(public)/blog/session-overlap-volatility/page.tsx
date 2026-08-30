import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "Session Overlap Trading: Why Most of Your Volatility Happens in a Few Hours · getALPHA",
  },
  description:
    "Volatility isn't spread evenly across the trading day. Most of it is concentrated in a couple of session-overlap hours, and a strategy tested without separating them is really being tested on two different markets at once.",
  alternates: { canonical: "/blog/session-overlap-volatility" },
};

export default function Page() {
  return (
    <BlogPost
      title="Session Overlap Trading: Why Most of Your Volatility Happens in a Few Hours"
      date="2026-08-30"
    >
      <p>
        A 24-hour market doesn&apos;t move at a constant rate for 24 hours. Most currency pairs do
        the bulk of their daily range in a two-to-four hour window, and are comparatively flat for
        the rest. A strategy&apos;s statistics computed across the whole day are really an average
        of two different markets — a fast, liquid one and a slow, thin one — and averaging them
        together hides which one the strategy actually depends on.
      </p>

      <h2>Where the volatility actually comes from</h2>
      <p>
        Forex trades through overlapping regional sessions — Tokyo, London, New York — and each one
        opens with a different set of participants active. Volume and volatility rise when two
        sessions are open at once, because that&apos;s when the largest number of banks, funds and
        retail participants are pricing the same pairs simultaneously. The London–New York overlap,
        roughly 13:00–16:00 UTC, is the single busiest window for most majors — it&apos;s common for
        a pair to cover a third or more of its entire daily range inside those few hours. The Tokyo
        session and the early London session, by contrast, are usually thinner and choppier, with
        wider effective spreads relative to the moves available.
      </p>
      <p>
        This isn&apos;t a minor scheduling detail. It means the market a strategy is trading changes
        shape several times a day — different liquidity, different spread cost relative to typical
        move size, different tendency to trend versus chop — while the strategy&apos;s rules stay
        the same.
      </p>

      <h2>Why a strategy&apos;s numbers can hide this</h2>
      <p>
        A backtest or a journal summary that reports one win rate and one expectancy for a strategy
        is implicitly assuming the strategy performs the same way regardless of when it&apos;s
        traded. In practice it&apos;s common for a strategy to be strongly profitable inside the
        overlap and roughly breakeven or negative outside it — two very different edges blended into
        one number that looks moderately positive overall. Traded only in its good window, the
        strategy might be excellent. Traded around the clock because the setup &ldquo;still looks
        valid,&rdquo; it&apos;s carrying a chunk of trades with a different, weaker expectancy than
        the summary statistic suggests.
      </p>
      <p>
        The same split shows up in cost, not just in edge. Spread and slippage are close to fixed in
        pip terms but the average move available to absorb them isn&apos;t — during a thin session
        the same spread eats a much larger share of the typical range, which quietly lowers
        expectancy on every trade taken there even before the setup quality is considered.
      </p>

      <h2>What to check in your own numbers</h2>
      <ul>
        <li>
          <strong>Win rate and expectancy split by hour of entry (UTC)</strong>, not just totalled
          across the day — the overlap window and the quiet windows should be looked at as separate
          samples.
        </li>
        <li>
          <strong>Average realized spread cost as a share of the stop distance</strong>, by session
          — a stop that&apos;s comfortably wide relative to spread during the overlap can be tight
          relative to spread during the Asia session.
        </li>
        <li>
          <strong>Trade frequency by hour</strong> — a strategy that takes as many trades in a quiet
          session as in the overlap is very likely taking marginal setups just to stay active, not
          because the setups are equally good.
        </li>
        <li>
          <strong>Whether losing streaks cluster in a specific session</strong> — a strategy failing
          consistently outside its best hours looks, from the trade log alone, indistinguishable from
          a strategy that&apos;s simply having a bad run.
        </li>
      </ul>
      <p>
        None of this requires a different strategy. It requires knowing which hours the current one
        actually works in, and either restricting trading to them or holding the outside-window
        trades to a stricter standard.
      </p>

      <h2>Why this is easy to miss by hand</h2>
      <p>
        Splitting a trade log by entry hour and recomputing expectancy for each slice is exactly the
        kind of check that&apos;s simple in principle and rarely done by hand, because it means
        re-running the same math several times instead of once. <Link href="/features/trading-journal">getALPHA</Link>{" "}
        syncs closed trades directly from MT5 with their entry timestamps intact, so that split is
        a filter, not a recalculation, and{" "}
        <Link href="/features/ai-trade-coach">the AI coach</Link> can surface it in a process
        review — whether a strategy&apos;s losses are concentrated outside its usual overlap-hour
        trades — rather than leaving the pattern to be noticed by feel after enough of it has
        already happened. <Link href="/features/session-brief">The session brief</Link> covers the
        other half: what&apos;s scheduled today and where the calendar itself points to elevated
        volatility, before the session starts.
      </p>
    </BlogPost>
  );
}
