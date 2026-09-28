import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "ATR Stops vs. Fixed-Pip Stops: Why the Same Stop Distance Means Different Risk · getALPHA",
  },
  description:
    "A 20-pip stop is not one risk decision, it's a different one every day depending on volatility. Why a fixed-pip stop drifts and what an ATR stop actually fixes.",
  alternates: { canonical: "/blog/atr-vs-fixed-pip-stops" },
};

export default function Page() {
  return (
    <BlogPost
      title="ATR Stops vs. Fixed-Pip Stops: Why the Same Stop Distance Means Different Risk"
      date="2026-09-27"
    >
      <p>
        A 20-pip stop on a trade taken during a quiet Asian session and a 20-pip stop on the same
        pair an hour after a news release are not the same risk decision, even though the log
        shows the identical number both times. The distance is fixed; the amount of normal price
        movement it has to absorb is not. A fixed-pip stop is really a bet on how much the market
        moves, made without ever looking at how much the market is actually moving.
      </p>

      <h2>What a fixed distance actually measures</h2>
      <p>
        A stop&apos;s job is to sit far enough from entry that ordinary noise doesn&apos;t take it out,
        while sitting close enough that being wrong doesn&apos;t cost more than the trade is worth.
        Both of those depend on volatility, and volatility is not constant. The same 20 pips that
        is roughly one average true range on a pair in a quiet week can be a third of an average
        true range the week volatility triples. A stop that was appropriately tight in the first
        case is set up to get clipped by normal movement in the second — not because the trade idea
        was wrong, but because the stop was measuring pips instead of measuring risk.
      </p>
      <p>
        This is easy to miss because the number on the ticket looks like discipline. Twenty pips is
        twenty pips every time, which feels consistent. What&apos;s actually inconsistent is what
        that distance represents from one trade to the next — sometimes a stop with real room to
        work, sometimes a stop parked inside the noise.
      </p>

      <h2>What an ATR stop changes</h2>
      <p>
        An ATR stop sets the distance as a multiple of the average true range over some lookback —
        1.5×ATR(14), for example — instead of a flat number of pips. The stop widens automatically
        when the recent range widens and tightens when it contracts, so the thing being held
        constant is the stop&apos;s relationship to current volatility, not its distance on a price
        chart. Two trades with a 1.5×ATR stop are comparable in a way two trades with a 20-pip stop
        are not, because both stops are absorbing roughly the same amount of normal movement
        relative to the conditions they were placed in.
      </p>
      <p>
        This doesn&apos;t make the stop better at predicting where price reverses — nothing does
        that reliably. What it fixes is a specific failure mode: a strategy that looks like it has
        an edge in backtests run mostly during average volatility, and then gets stopped out at an
        elevated rate the first time it hits a genuinely volatile stretch, for no reason the
        strategy itself changed.
      </p>

      <h2>Where a fixed-pip stop is actually the right call</h2>
      <p>
        ATR stops aren&apos;t automatically superior. A strategy built around a specific structural
        level — a prior swing low, a round number, a session high — has a reason for the stop to sit
        exactly where it sits, and that reason has nothing to do with the average true range. Forcing
        an ATR multiple onto a level-based strategy just replaces one arbitrary number with another,
        more complicated one. Fixed-pip and level-based stops make sense when the invalidation point
        is a specific price. ATR stops make sense when the invalidation point is really &ldquo;more
        movement than this setup should see if it&apos;s working,&rdquo; which is a volatility
        question, not a level question.
      </p>
      <p>
        The mistake isn&apos;t picking one method — it&apos;s not knowing which kind of stop you&apos;re
        actually running, and assuming a fixed number is neutral when it quietly reflects the
        volatility regime it happened to be set in.
      </p>

      <h2>What to actually track</h2>
      <ul>
        <li>
          <strong>Stop distance as a multiple of ATR at entry</strong> — logged per trade even when
          the stop itself is a fixed pip count, so a 20-pip stop placed at 0.6×ATR and one placed at
          2×ATR stop showing up as the same risk.
        </li>
        <li>
          <strong>Stop-out rate by volatility regime</strong> — split trades into quiet vs. volatile
          conditions at entry and compare how often each group gets stopped before reaching target.
        </li>
        <li>
          <strong>Expectancy under both stop rules</strong> — rerun the same trade history with a
          fixed-pip stop and an ATR-based stop and compare, rather than assuming the more
          sophisticated-looking rule performs better.
        </li>
        <li>
          <strong>ATR at the time of entry, not just at review</strong> — volatility measured after
          the fact can already reflect the move the trade was trying to catch, which is a different
          number from what was knowable when the stop was placed.
        </li>
      </ul>
      <p>
        Most traders who run this comparison find their fixed-pip stop was never really one number —
        it was a loose stop in quiet conditions and a tight one in volatile conditions, and the
        strategy&apos;s results were partly a record of which regime showed up more often in the
        sample.
      </p>

      <h2>Why this is hard to see without a record</h2>
      <p>
        A stop-out reads the same in a trade log whether it was hit by a genuine reversal or by
        ordinary noise the distance was never built to survive, so the difference only shows up once
        volatility at entry is logged alongside the stop itself.{" "}
        <Link href="/features/trading-journal">getALPHA</Link> pulls the stop distance for every
        trade synced from MT5, and the process review in{" "}
        <Link href="/features/ai-trade-coach">getALPHA&apos;s AI coach</Link> checks whether a stop
        rule is actually holding a consistent risk profile across regimes or just holding a
        consistent number on the ticket.
      </p>
    </BlogPost>
  );
}
