import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute: "Why Your Trading Journal Is Also Your Best Tax Record · getALPHA",
  },
  description:
    "The record you keep to review your trading is the same record a tax filing needs: dates, sizes, entries, exits and fees for every closed position. Why reconstructing it from a broker statement in April is the hard way to do this.",
  alternates: { canonical: "/blog/trading-journal-tax-record" },
};

export default function Page() {
  return (
    <BlogPost title="Why Your Trading Journal Is Also Your Best Tax Record" date="2026-11-11">
      <p>
        This is not tax advice — rules on what counts as a disposal, how gains are classified, and
        what has to be reported differ by country and by instrument, and the only reliable answer
        for your situation comes from a tax professional in your jurisdiction. What follows is
        about the record-keeping underneath that question, which is the same regardless of where
        you file: a tax return built from trading activity needs exactly the fields a decent
        trading journal already has.
      </p>

      <h2>What a tax filing actually needs, per trade</h2>
      <p>
        Whatever form the numbers end up on, the raw inputs are the same five or six fields for
        every closed position:
      </p>
      <ul>
        <li>
          <strong>Open and close date</strong> — not just the month, the actual date, since some
          jurisdictions tax a position differently depending on how long it was held.
        </li>
        <li>
          <strong>Instrument and direction</strong> — what was traded and whether it was long or
          short, because the two can be reported differently.
        </li>
        <li>
          <strong>Entry and exit price, and size</strong> — enough to reconstruct the realized gain
          or loss independently of whatever number the broker reports.
        </li>
        <li>
          <strong>Fees and commissions</strong>, kept separate from the price — some filings let
          you net these against the gain, and you cannot do that if they were never logged apart
          from P&amp;L.
        </li>
        <li>
          <strong>Realized P&amp;L in your account currency</strong>, plus the currency itself if
          you trade more than one account denomination.
        </li>
      </ul>
      <p>
        A process-focused trading journal — the kind built to check sizing and stop discipline —
        already captures all of this, because those same fields are what a process review needs
        too. The overlap is not a coincidence; both uses need an accurate, contemporaneous record
        of what actually happened, not a recollection of it.
      </p>

      <h2>Where a broker statement alone falls short</h2>
      <p>
        A broker&apos;s own history is the source of truth for prices and fills, but it is usually
        organized around individual orders, not the round-trip trades a tax filing cares about. A
        position scaled into with three separate orders and closed with two more shows up as five
        line items, not one trade with one realized gain — and matching them back into trades
        correctly (which lot closed against which) is exactly the kind of manual reconciliation
        that produces errors when it is done once a year under deadline pressure instead of as
        trades close.
      </p>
      <p>
        Multi-currency accounts make this worse. A broker statement in your account currency has
        already done a conversion somewhere, and if your filing requires gains computed in a
        different currency, or at the exchange rate on the trade date rather than a monthly
        average, that recalculation is not something the statement hands you — it is something you
        have to redo from the underlying trade data.
      </p>

      <h2>Why reconstructing it in April is the hard way</h2>
      <p>
        The same failure mode shows up here as with any journal kept after the fact: a trade closed
        eight months ago, with a broker statement that shows the fill but not the reasoning, is a
        trade you now have to take on faith. Did that commission get included in the broker&apos;s
        P&amp;L figure already, or does it still need to be added back? Was that position actually
        closed and reopened, or rolled? These are answerable questions in the moment a trade
        closes, and much harder ones to answer by re-reading a year-end export with hundreds of
        rows in it.
      </p>
      <p>
        The fix is not a once-a-year project — it is the same discipline as journaling for process
        review, just pointed at a different deadline. A record updated as each trade closes needs
        no reconstruction later, because nothing was left to reconstruct.
      </p>

      <h2>What this does and doesn&apos;t replace</h2>
      <p>
        A trading journal is not tax software, and it does not know which figures your jurisdiction
        wants on which form. What it can do is remove the hardest part of preparing for that
        conversation with a tax professional: handing them a complete, accurate, trade-by-trade
        record instead of a pile of monthly statements they have to reconcile themselves.{" "}
        <Link href="/features/trading-journal">getALPHA&apos;s journal</Link> syncs closed trades
        directly from MT5, MT4, cTrader or TradingView, so entry, exit, size and P&amp;L are read
        from the platform rather than retyped from memory months later — the same record built for
        reviewing your own trading turns out to be the one worth having ready when tax season
        arrives.
      </p>
    </BlogPost>
  );
}
