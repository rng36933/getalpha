import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: { absolute: "MT5 vs Manual Spreadsheet Journal: Where the Numbers Diverge · getALPHA" },
  description:
    "MT5's own history and a hand-kept spreadsheet rarely agree by the time both are totalled. Where the two numbers actually split, and which one is usually right.",
  alternates: { canonical: "/blog/mt5-vs-manual-spreadsheet-journal" },
};

export default function Page() {
  return (
    <BlogPost title="MT5 vs Manual Spreadsheet Journal: Where the Numbers Diverge" date="2026-08-19">
      <p>
        Open MT5&apos;s History tab, then open the spreadsheet you have been keeping alongside it, and
        the totals rarely match. Not by a rounding error — sometimes by a meaningfully different
        P&amp;L, a different win rate, a different average risk. Neither number is fabricated. They
        are counting different things, and the gap between them is worth understanding before you
        trust either one.
      </p>

      <h2>Swaps and commissions get counted once, in one place</h2>
      <p>
        MT5&apos;s history report includes swap and commission as separate columns on every closed
        position. A spreadsheet filled in by hand from memory or from the trade ticket almost
        never does — it is easy to copy the entry price, exit price and lot size, and forget that
        an overnight swap charge quietly ate part of the result. On a handful of trades this is
        noise. On a few hundred trades held for days at a time, swap alone can move an account&apos;s
        totalled P&amp;L by a meaningful margin, and it will only show up in whichever record
        actually pulled it from the terminal.
      </p>

      <h2>Partial closes turn one trade into several rows</h2>
      <p>
        Closing a position in two or three pieces is normal — take half off at a first target,
        trail the rest. MT5&apos;s history logs each partial close as its own row with its own P&amp;L,
        which is accurate but tedious to reassemble by hand. A spreadsheet kept in real time
        usually collapses the whole thing into one line, one entry price, one exit price, because
        that is what the trader remembers doing. The two are describing the same trade, but a
        journal built from memory will consistently round off the fact that risk was reduced
        partway through — which is exactly the kind of process detail a journal exists to catch.
      </p>

      <h2>The stop-loss field is the one that breaks first</h2>
      <p>
        MT5&apos;s history shows whether a stop-loss was attached to a position and where, but only
        the value at close — if a stop was moved three times before the trade exited, the report
        shows the last one, not the one decided at entry. A spreadsheet has the opposite problem:
        it shows whatever was typed in, which is often the stop the trader meant to set rather
        than the one that was actually live on the position. Both records can report a stop-loss
        and both can be describing something that didn&apos;t happen exactly that way. This single
        field is usually where the two totals disagree the most, because it is the one number a
        trader has the strongest incentive to remember favourably.
      </p>

      <h2>Timezone and session boundaries shift the day a trade belongs to</h2>
      <p>
        MT5 timestamps trades in the broker&apos;s server time, which is rarely the trader&apos;s local
        time and rarely UTC either. A spreadsheet filled in at the end of a trading session tends
        to log trades against whatever day it felt like when the entry was made. A trade opened
        late at night can land on different calendar days in the two records, which changes which
        day&apos;s win rate or drawdown it counts toward — not the outcome, just which bucket it
        falls into, which is enough to make a day-by-day comparison between the two records
        disagree even when every individual trade matches.
      </p>

      <h2>Which one to trust</h2>
      <p>
        For P&amp;L, swap, commission and exact fill data: MT5&apos;s own history is the source of
        truth, because it is pulled directly from the broker rather than typed in after the fact.
        For everything MT5 doesn&apos;t record at all — the plan behind a trade, why an exit happened
        early, what the setup actually was — the manual side of the journal is the only record
        that exists. The two are not competing for the same job. A spreadsheet trying to also
        reconstruct P&amp;L by hand is redoing work MT5 already did correctly, with more room for
        error.
      </p>
      <p>
        That is the specific split{" "}
        <Link href="/features/trading-journal">getALPHA</Link> is built around: the numeric side —
        entries, exits, swap, commission, stop-loss as actually placed — synced straight from MT5
        through a{" "}
        <Link href="/getALPHA-Sync.mq5">read-only add-on</Link>, so it matches the broker&apos;s own
        record instead of a remembered one, while the process side stays something you can review
        against it rather than re-derive from scratch every week.
      </p>
    </BlogPost>
  );
}
