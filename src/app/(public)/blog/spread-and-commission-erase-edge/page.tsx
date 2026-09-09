import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "How Spread and Commission Quietly Erase a \"Winning\" Strategy · getALPHA",
  },
  description:
    "A strategy report showing positive expectancy is usually a report on price movement alone. Spread and commission are paid on every trade regardless of outcome, and for a lot of strategies that's the whole edge, gone.",
  alternates: { canonical: "/blog/spread-and-commission-erase-edge" },
};

export default function Page() {
  return (
    <BlogPost
      title='How Spread and Commission Quietly Erase a "Winning" Strategy'
      date="2026-09-09"
    >
      <p>
        A backtest or a trade log that shows a positive expectancy in pips is measuring one thing:
        how the strategy did against price movement. Spread and commission aren&apos;t price
        movement — they&apos;re a cost paid on every single trade, win or lose, and on a lot of
        summaries they either don&apos;t appear at all or get folded into the numbers as if
        they&apos;re small and constant. They&apos;re constant. They&apos;re rarely small relative
        to the edge they&apos;re sitting on top of, and a strategy can be genuinely, mechanically
        profitable on price and still lose money once the cost of entering and exiting is put back
        in.
      </p>

      <h2>What&apos;s actually being subtracted</h2>
      <p>
        Spread is the gap between the bid and the ask, paid the moment a market order fills. It
        isn&apos;t a fee charged separately — it&apos;s baked into the fill price, which is exactly
        why it&apos;s so easy to leave out of a P&amp;L review that&apos;s built from entry and exit
        prices without asking what the quoted price actually was at each end. Commission is the
        second cost, charged per lot per round turn regardless of whether the trade wins or loses.
        Both are the same in one respect that matters more than their size: they&apos;re paid on
        frequency, not on being right. A strategy that trades ten times a day pays this cost ten
        times a day whether nine of those trades are good decisions or none of them are.
      </p>

      <h2>Where it hides best</h2>
      <p>
        The strategies most exposed to this are exactly the ones that look best on a raw pip count
        — high win rate, small average win, short holding time. Take a strategy with a 60% win
        rate, a 5-pip average win and a 4-pip average loss. Gross expectancy per trade is{" "}
        <code>(0.6 × 5) − (0.4 × 4) = 1.4 pips</code>. That&apos;s a real edge on paper. Now put
        back a 1.2-pip spread paid on entry and a commission working out to roughly 0.7 pips per
        round turn on the lot size being traded — a combined 1.9 pips of cost against a 1.4-pip
        edge. The strategy didn&apos;t get worse. The report was just never measuring the thing
        that determines whether the strategy makes money.
      </p>
      <p>
        A strategy with a 40-pip average win and the same cost structure barely notices it. The
        damage is proportional to how small the edge is relative to the fixed cost sitting on top
        of every trade — which means scalping and high-frequency setups are structurally the most
        exposed, not because they&apos;re worse strategies, but because they&apos;re the ones where
        1.9 pips is a large fraction of the number being fought over.
      </p>

      <h2>Frequency is the multiplier that makes it visible</h2>
      <p>
        A single trade&apos;s spread and commission cost looks trivial next to the account balance.
        It stops looking trivial the moment it&apos;s totalled across a month instead of looked at
        one trade at a time. A strategy placing 300 trades a month at 1.9 pips of combined cost each
        has paid 570 pips to the broker before a single directional call has been judged right or
        wrong — often a larger number than the strategy&apos;s entire gross profit for the month,
        and one that never shows up as a line item unless it&apos;s deliberately added up rather
        than absorbed into the fill prices of every individual trade.
      </p>

      <h2>What to track instead of raw pips</h2>
      <ul>
        <li>
          <strong>Cost-adjusted expectancy per trade</strong>, not gross pips or gross R — the
          number that includes spread and commission on every entry and exit, not just the ones
          large enough to notice.
        </li>
        <li>
          <strong>Total spread and commission paid over a period</strong>, compared directly against
          gross P&amp;L for the same period, so the cost is a number on the page instead of an
          assumption baked into fill prices.
        </li>
        <li>
          <strong>Cost as a percentage of average win</strong>, broken out per strategy and per
          instrument — the same 1.9 pips means something very different to a scalping strategy than
          to a swing strategy, and blending them into one account-wide average hides which one is
          actually exposed.
        </li>
        <li>
          <strong>Expectancy recalculated at the actual trade frequency</strong>, since a strategy
          that looks profitable at 50 trades a month and unprofitable at 300 isn&apos;t two
          different strategies — it&apos;s one strategy whose edge was never large enough to survive
          being traded that often.
        </li>
      </ul>
      <p>
        None of this requires a different strategy. It requires the report to include the cost that
        was already being paid on every trade, instead of a summary built from round entry and exit
        numbers that quietly assume the price gotten was the price seen on the chart.
      </p>

      <h2>Why this is easy to miss in a manual log</h2>
      <p>
        A spreadsheet filled in from memory or from a broker&apos;s summary screen usually has room
        for entry price, exit price and result — not the actual bid/ask spread paid on that specific
        fill, and rarely a running total of commission separated out from the P&amp;L it was
        subtracted from.{" "}
        <Link href="/features/trading-journal">getALPHA</Link> pulls spread and commission from MT5
        on every trade as it closes, so the cost is a number in the record instead of something
        assumed away. That&apos;s what lets{" "}
        <Link href="/features/ai-trade-coach">getALPHA&apos;s AI coach</Link> tell a strategy with a
        real edge from one whose entire reported profit is the gap between what the chart shows and
        what the broker actually filled.
      </p>
    </BlogPost>
  );
}
