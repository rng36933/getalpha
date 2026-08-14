import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: { absolute: "Trading Journal for Prop Firm Challenges · getALPHA" },
  description:
    "A prop firm challenge doesn't fail you for losing trades. It fails you for breaching a rule you weren't tracking in real time. What to log to see a breach coming.",
  alternates: { canonical: "/blog/trading-journal-for-prop-firm-challenges" },
};

export default function Page() {
  return (
    <BlogPost title="Trading Journal for Prop Firm Challenges" date="2026-08-14">
      <p>
        Most prop firm challenges aren&apos;t failed by bad trading. They&apos;re failed by a rule
        the trader knew about, wasn&apos;t tracking in real time, and crossed without noticing until
        the account was already disabled. A daily loss limit measured from a starting balance that
        resets at a time you didn&apos;t check. A max drawdown that&apos;s trailing, not static, so it
        moves against you as equity climbs. A journal built for a funded evaluation has to track the
        rules themselves, not just the trades — a normal P&amp;L log doesn&apos;t do that.
      </p>

      <h2>The rules a normal journal doesn&apos;t track</h2>
      <p>
        Most challenge rulebooks share a handful of numbers that a standard trade log never records,
        because retail trading has no equivalent constraint:
      </p>
      <ul>
        <li>
          <strong>Daily loss limit</strong> — usually a percentage of the balance at the start of the
          trading day, not the account&apos;s current balance. Get the reset time wrong and the
          number you&apos;re watching is wrong too.
        </li>
        <li>
          <strong>Maximum drawdown</strong> — often trailing, calculated from the account&apos;s
          highest equity point reached, not from the initial balance. A string of wins can tighten
          this limit even as the account looks healthier.
        </li>
        <li>
          <strong>Profit target</strong> — the number that ends the challenge in your favor, usually
          8-10% of starting balance for the first phase.
        </li>
        <li>
          <strong>Minimum trading days</strong> — a floor on how many separate days you have to
          trade, which penalizes hitting the profit target too fast on too few sessions.
        </li>
        <li>
          <strong>Consistency rules</strong> — a cap on how much of total profit any single day is
          allowed to represent, meant to catch one lucky oversized trade carrying the whole
          evaluation.
        </li>
      </ul>
      <p>
        None of these live in a P&amp;L column. They live in the relationship between today&apos;s
        trades and a threshold that moves — which is exactly the kind of thing a log with timestamps
        and running balances can catch, and a log with only entries and exits can&apos;t.
      </p>

      <h2>Why the breach usually isn&apos;t the trade that lost</h2>
      <p>
        The trade that breaches a daily loss limit is rarely the biggest loser in the account&apos;s
        history — it&apos;s an ordinary-sized loss that landed on a day already down from two earlier
        ones. Reviewed in isolation, each of the three trades looks unremarkable. Reviewed as a
        running total against the day&apos;s limit, the third one was never survivable regardless of
        its own size. That distinction only shows up if the journal is tracking cumulative daily risk
        against the limit in real time, not summarizing P&amp;L after the fact.
      </p>
      <p>
        The same pattern shows up with trailing drawdown. A trader who peaks at +6% and gives half of
        it back isn&apos;t failing because of one trade — they&apos;re failing because nobody was
        watching the gap between the equity peak and the current balance narrow with each losing
        trade after it.
      </p>

      <h2>What to log during a challenge, specifically</h2>
      <ul>
        <li>
          <strong>Starting balance for the current trading day</strong>, recorded at the reset time
          the firm actually uses — not midnight local time by default.
        </li>
        <li>
          <strong>Running daily P&amp;L against the daily loss limit</strong>, updated after every
          closed trade, not reviewed once at the end of the session.
        </li>
        <li>
          <strong>Equity high-water mark</strong>, if the drawdown rule is trailing, so the actual
          remaining buffer is visible rather than assumed from the starting balance.
        </li>
        <li>
          <strong>Days traded so far</strong>, against the minimum, so the plan doesn&apos;t
          accidentally clear the profit target three days short of qualifying.
        </li>
        <li>
          <strong>Largest single day&apos;s profit as a share of total profit</strong>, if a
          consistency rule applies, checked before requesting payout, not after.
        </li>
      </ul>
      <p>
        Every one of these needs the same underlying data a normal journal already has — entries,
        exits, size, timestamps — arranged against a threshold instead of just logged as history.
      </p>

      <h2>Where a synced journal changes the trade-off</h2>
      <p>
        Tracking five moving thresholds by hand across a multi-week evaluation is exactly the kind of
        bookkeeping that degrades under pressure — the same pressure a challenge is designed to
        apply. A missed update on a losing day is the one that matters most, because that&apos;s the
        day closest to a breach. <Link href="/features/trading-journal">getALPHA</Link> syncs closed
        trades directly from MT5, so daily and running totals are computed from what the broker
        actually recorded rather than from a spreadsheet cell that didn&apos;t get updated after the
        third trade of a rough morning.
      </p>
      <p>
        That doesn&apos;t replace reading the specific rulebook for the firm you&apos;re with — reset
        times, drawdown type, and consistency thresholds all vary by provider, and no journal can
        guess a rule it hasn&apos;t been told. What it changes is whether the numbers you&apos;re
        checking against those rules are current when you need them, instead of current as of
        whenever you last opened the spreadsheet.
      </p>
    </BlogPost>
  );
}
