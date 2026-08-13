import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: { absolute: "5 Things a Trading Journal Should Show You · getALPHA" },
  description:
    "Most journals show you what happened. A useful one shows you what you keep doing — and whether it's working. Five things worth actually looking at.",
  alternates: { canonical: "/blog/5-things-a-trading-journal-should-show-you" },
};

export default function Page() {
  return (
    <BlogPost title="5 Things a Trading Journal Should Show You" date="2026-08-13">
      <p>
        A spreadsheet full of closed trades is not the same thing as a journal. It is a list. A
        journal earns the name when it shows you something a list can&apos;t: a pattern, a
        tendency, a number that moves in a direction you didn&apos;t notice while you were busy
        taking the next trade. Here are five things worth checking for, in order of how often
        traders skip them.
      </p>

      <h2>1. Expectancy, not just P&amp;L</h2>
      <p>
        Total P&amp;L tells you whether you made money over a period. It doesn&apos;t tell you
        whether the process behind it is repeatable, because one oversized winner can carry a
        month of otherwise mediocre trades. Expectancy — average win times win rate, minus average
        loss times loss rate — is the number that says whether the edge is real on a per-trade
        basis. A journal that only totals P&amp;L is hiding the number that actually matters.
      </p>

      <h2>2. Risk per trade, over time</h2>
      <p>
        Not the risk you planned to take — the risk you actually took, trade by trade, plotted
        against time. This is where journals catch the thing traders almost never admit to
        themselves: sizing creeping up after a losing streak, trying to win it back faster, or
        sizing shrinking after a big win out of a caution that wasn&apos;t there before. A single
        risk percentage in a settings page tells you nothing. A trend line of actual risk taken
        tells you whether that number was ever really being followed.
      </p>

      <h2>3. Stop-loss discipline, as a rate</h2>
      <p>
        Not whether you used a stop on your best trade — what fraction of <em>all</em> trades had
        a stop-loss set before entry. This is a binary, trade-by-trade fact, and it compresses into
        a single percentage that is uncomfortable to look at the first time. A trader who sets
        stops 90% of the time thinks of themselves as disciplined. The other 10% is usually where
        the account damage happens, and it never shows up in a number that only measures the
        trades that went right.
      </p>

      <h2>4. Planned reward-to-risk vs. what actually happened</h2>
      <p>
        Every trade has a target set at entry, at least in principle. What a journal should show
        is how often the exit matched that plan versus how often it drifted — closed early on a
        winner because it felt too good to be true, or held past the stop because the trade
        &ldquo;felt like it would come back.&rdquo; The gap between planned and actual
        reward-to-risk is a direct read on how much of the trading is still being decided in the
        moment, after the plan was supposedly already made.
      </p>

      <h2>5. Performance broken out by setup, not lumped together</h2>
      <p>
        A journal that reports one aggregate expectancy across every trade is averaging together
        strategies that might have nothing to do with each other — a breakout entry and a
        mean-reversion fade can both be net positive individually while cancelling out in a single
        blended number. Splitting results by setup, instrument, or session is what turns
        &ldquo;I&apos;m roughly breakeven&rdquo; into &ldquo;this setup works and this one has been
        losing money for two months,&rdquo; which is the only version of that sentence you can
        actually act on.
      </p>

      <h2>Why most journals don&apos;t show these by default</h2>
      <p>
        A spreadsheet shows you whatever columns you set up, and building expectancy, risk trends,
        stop-loss rate, and reward-to-risk drift into a spreadsheet by hand — correctly, and kept
        up to date — is real work most traders don&apos;t get around to. It&apos;s also exactly
        what a journal is for, if it&apos;s going to be more than a record of what already
        happened. <Link href="/">getALPHA</Link> computes all five directly from your synced MT5
        trade history, so the numbers are there without a spreadsheet formula to maintain — sized
        risk, stop discipline, and reward-to-risk drift, broken out by setup, updated as the trades
        close.
      </p>
    </BlogPost>
  );
}
