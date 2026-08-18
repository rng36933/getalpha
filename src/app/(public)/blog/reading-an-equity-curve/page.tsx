import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: { absolute: "Reading an Equity Curve: What a Smooth Line Actually Hides · getALPHA" },
  description:
    "A rising, smooth equity curve is the image every trader wants to show. It is also one of the easiest charts to be misled by — here is what it does and doesn't tell you.",
  alternates: { canonical: "/blog/reading-an-equity-curve" },
};

export default function Page() {
  return (
    <BlogPost title="Reading an Equity Curve: What a Smooth Line Actually Hides" date="2026-08-18">
      <p>
        The equity curve is the chart every trading strategy gets judged by at a glance — up and to
        the right, ideally with no sharp dips. It is also one of the least informative charts in
        trading if that is all you look at, because a line plotting cumulative account balance over
        time was never built to show you the things that actually matter: how the money was made, in
        what order, and at what risk.
      </p>

      <h2>What the line is actually plotting</h2>
      <p>
        An equity curve is a running total — balance after trade one, balance after trade two, and so
        on. That is useful for one question only: is the account bigger than it was. It says nothing
        on its own about win rate, reward-to-risk, position sizing, or how close the account came to
        real trouble along the way. Two accounts can end the month at the same balance with
        completely different curves underneath — one from twenty consistent trades, the other from
        four wild ones that happened to net out the same. The chart looks identical. The process
        behind it is not.
      </p>

      <h2>Smoothness is partly a scale artifact</h2>
      <p>
        A curve looks smooth or jagged depending on what is plotted against what. Plot P&L against
        calendar time and a string of small losses spread across a quiet week can visually disappear
        into a chart dominated by two good trading days. Plot the same data against trade sequence
        instead, and the losing streak sits in full view, unbroken by the calm days on either side of
        it. Neither view is wrong, but a curve smoothed by calendar time is the one that gets shared,
        because it is the one that looks best.
      </p>
      <p>
        Position sizing does the same thing from a different angle. A trader who increases size as the
        account grows can produce a curve that looks steadily smoother in dollar terms even while the
        percentage risk taken on each trade is climbing. The line looks calmer. The account is not
        getting safer — it is getting more sensitive to the next losing streak, and the curve will not
        show that until the streak arrives.
      </p>

      <h2>One trade can be carrying the whole curve</h2>
      <p>
        Remove the single best trade of the month from an equity curve and look at what is left. For a
        surprising number of accounts, the answer is: not much of an upward slope. A strategy that
        depends on one outsized trade to turn a flat or losing month into a winning one is not the
        same as a strategy that is consistently profitable — the total looks the same, but one of them
        is repeatable and the other is closer to a single lucky outcome dressed up as a track record.
        The curve alone cannot tell you which one you are looking at; you have to take the best trade
        out and check.
      </p>

      <h2>A drawdown can hide inside a line that is still rising</h2>
      <p>
        Because an equity curve only ever shows the running total, a drawdown that happened in the
        middle of the month can be nearly invisible by the time the month ends on a new high. The eye
        follows the line to where it finishes, not to how far it fell in between. That gap between
        &ldquo;ended up&rdquo; and &ldquo;stayed in control the whole way&rdquo; is exactly where
        blown risk limits and margin calls happen — not at the low point of a curve that never
        recovered, but in the middle of one that eventually did. A curve that only shows where the
        account ended up will never show you how close it came to not getting there.
      </p>

      <h2>What to actually look at alongside it</h2>
      <ul>
        <li>
          <strong>The curve plotted by trade sequence, not calendar date</strong> — so a losing streak
          reads as a losing streak, not as a quiet week.
        </li>
        <li>
          <strong>Maximum drawdown, separately, in both currency and percentage terms</strong> — the
          worst point relative to the peak before it, not just the current balance relative to the
          starting one.
        </li>
        <li>
          <strong>The curve with the single best trade removed</strong> — a quick check for whether the
          slope is a strategy or an outlier.
        </li>
        <li>
          <strong>Position size over time next to the curve</strong> — so a smoother-looking line can
          be checked against whether it was earned by consistency or bought with rising risk.
        </li>
      </ul>
      <p>
        None of this means the equity curve is useless — it is still the fastest way to see whether an
        account is trending in the right direction. It means treating it as a summary, not as evidence
        on its own, the same way a headline number like win rate needs the numbers underneath it
        before it means anything.
      </p>
      <p>
        This is why <Link href="/features/trading-journal">getALPHA</Link>&apos;s journal keeps
        drawdown, position size and per-trade sequence next to the equity curve rather than leaving it
        to stand alone, and why{" "}
        <Link href="/features/ai-trade-coach">process review</Link> reads the trades that built the
        curve rather than the curve itself — so a smooth line earned by rising risk doesn&apos;t get
        graded the same as one earned by a consistent process.
      </p>
    </BlogPost>
  );
}
