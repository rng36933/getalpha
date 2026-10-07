import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "Time Underwater: Why Drawdown Duration Matters as Much as Drawdown Depth · getALPHA",
  },
  description:
    "A 20% drawdown that recovers in three weeks and one that drags on for eight months are not the same event, even with identical depth. What time underwater actually measures, and why most journals only track the depth.",
  alternates: { canonical: "/blog/time-underwater-drawdown-duration" },
};

export default function Page() {
  return (
    <BlogPost
      title="Time Underwater: Why Drawdown Duration Matters as Much as Drawdown Depth"
      date="2026-10-04"
    >
      <p>
        Most traders can tell you their worst drawdown as a percentage. Few can tell you how long
        it lasted. That is a gap, because a 20% drawdown that recovers in three weeks and a 20%
        drawdown that drags on for eight months put very different pressure on a strategy — and on
        the person trading it — even though they show up as the same number on an equity curve.
      </p>

      <h2>Depth and duration are different risks</h2>
      <p>
        Depth tells you how much capital was lost at the worst point. Duration tells you how long
        that capital stayed lost. A strategy with shallow but long drawdowns can be harder to run
        than one with deep but short ones, because duration is what erodes conviction. A trader can
        usually tolerate a sharp 15% drawdown they expect to recover from within a month. The same
        15%, still open after five months with no clear sign the strategy has turned, is what gets
        strategies abandoned at exactly the point they might have been about to work again.
      </p>
      <p>
        <strong>Time underwater</strong> is the metric that captures this: the number of trading
        days (or sessions, or weeks — whatever unit matches your frequency) between a new equity
        high and the point the account gets back above it. It is a separate number from maximum
        drawdown, and a journal that only logs the second one is missing half the picture.
      </p>

      <h2>How to actually measure it</h2>
      <p>
        From a trade-by-trade equity series, time underwater is straightforward to compute, even
        by hand on a spreadsheet:
      </p>
      <ul>
        <li>
          Track the <strong>running equity high</strong> after every closed trade.
        </li>
        <li>
          Whenever equity is below that high, the account is underwater — mark the date the high
          was last touched.
        </li>
        <li>
          When equity makes a new high, the drawdown that preceded it is closed: its duration is
          the gap between the old high and the new one.
        </li>
      </ul>
      <p>
        Do this across a full trade history and you get a distribution of drawdown lengths, not
        just a single worst-case depth. That distribution is usually more informative than the
        maximum drawdown number on its own, because it shows whether the worst depth was also the
        worst duration, or whether a smaller, longer drawdown was actually the harder one to sit
        through.
      </p>

      <h2>Why the two don&apos;t move together</h2>
      <p>
        Depth is mostly a function of losing streak size and per-trade risk — a few oversized
        losses in a row can produce a deep drawdown quickly. Duration is mostly a function of how
        long it takes the strategy&apos;s edge to reassert itself, which depends on trade
        frequency and win rate, not on how the drawdown started. A high-frequency strategy with a
        modest edge can dig a 10% hole in a bad week and climb back out in two, because there are
        enough trades afterward for the edge to show up again quickly. A low-frequency swing
        strategy can dig the same 10% hole and need three months simply because there are not many
        trades left in the quarter to recover with.
      </p>
      <p>
        This is also why duration is the number that should inform how long you give a strategy
        before concluding it is broken, not depth. A strategy sitting in its third month underwater
        on a strategy that typically takes four to six weeks to recover is behaving differently
        than its own history — that is a signal worth investigating. The same strategy sitting at
        its usual depth for its usual duration is just having a normal bad stretch.
      </p>

      <h2>What to log alongside it</h2>
      <ul>
        <li>
          <strong>Trades taken during the drawdown</strong> — a long duration with few trades
          inside it is a different situation than a long duration with the usual trade count, where
          the edge itself may have degraded.
        </li>
        <li>
          <strong>Position size during the drawdown</strong> — whether risk per trade stayed flat or
          crept up while trying to recover faster, which extends duration risk into depth risk.
        </li>
        <li>
          <strong>Historical duration distribution</strong> — what your own typical time-underwater
          looks like, so a current drawdown has a baseline to be compared against instead of just a
          feeling of how long is &ldquo;too long.&rdquo;
        </li>
      </ul>
      <p>
        None of this replaces watching depth — a drawdown can still be too deep to trade through
        regardless of how quickly it might recover. But depth alone tells you how bad the worst
        moment was. Duration tells you how long you actually had to sit with it, which is usually
        the harder part to survive.
      </p>
      <p>
        <Link href="/features/trading-journal">getALPHA</Link> tracks running drawdown against your
        MT5 history automatically and keeps the equity-high timestamps needed to compute time
        underwater, so a current drawdown has your own historical durations to be measured against
        instead of a gut sense of whether it has gone on too long.
      </p>
    </BlogPost>
  );
}
