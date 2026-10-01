import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "Pyramiding Into Winners: Scaling In Without Turning a Plan Into a Gamble · getALPHA",
  },
  description:
    "Adding to a winning position can be disciplined risk management or a slow-motion version of averaging down with the labels swapped. What separates the two, and what a pyramid actually needs before the first add.",
  alternates: { canonical: "/blog/pyramiding-into-winners" },
};

export default function Page() {
  return (
    <BlogPost
      title="Pyramiding Into Winners: Scaling In Without Turning a Plan Into a Gamble"
      date="2026-10-01"
    >
      <p>
        Pyramiding has a good reputation because the idea behind it is sound: add to a position
        that is already proving you right, instead of betting the whole size on the entry before
        the market has told you anything. The problem is that &ldquo;adding to a winner&rdquo; describes
        the trade log entry, not the decision behind it — and a pyramid built on a plan looks
        identical, in the history, to one built on the feeling that a trade that&apos;s up is a
        trade that can&apos;t lose.
      </p>

      <h2>What a pyramid actually is</h2>
      <p>
        A pyramid is a sequence of entries in the same direction, each one sized smaller than the
        last, each one triggered by the position moving in your favor by a defined amount, each
        one with its own stop. The shrinking size matters as much as the trigger: a pyramid where
        every add is the same size as the first isn&apos;t scaling in, it&apos;s doubling down with
        a delay, and it recreates the same risk concentration a single oversized entry would have
        had — just spread across three fills instead of one.
      </p>
      <p>
        The shape that actually reduces risk is the classic one: first entry at full planned size,
        second add at half that, third at half again. Total exposure grows slower than the
        position count, and the average entry price keeps moving in the direction the trade has
        already confirmed, not against it.
      </p>

      <h2>The line between pyramiding and averaging down with a lag</h2>
      <p>
        Averaging down adds to a loser hoping the average comes back in range. Pyramiding adds to
        a winner because the market already moved. Those are opposite trades on paper, but they
        fail the same way: both can become a method for not admitting the size on the table has
        grown past what was planned. A pyramid that keeps adding past the point where the original
        plan called a stop to a defined level is just a slower version of the same mistake —
        the stop on the combined position creeping further from entry with every add instead of
        tightening behind the move.
      </p>
      <p>
        The test that actually separates them: before the second entry goes in, is there a rule
        that says how many adds are allowed and where the stop on the whole position sits once
        they&apos;re all filled? If the answer is written down before the first add, it&apos;s a
        pyramid. If the answer is &ldquo;however far it keeps going,&rdquo; it&apos;s a trade that&apos;s being
        sized by the market&apos;s mood instead of a plan.
      </p>

      <h2>What has to be decided before the first add, not during the third</h2>
      <ul>
        <li>
          <strong>Trigger for each add</strong> — a specific price level or move size (e.g. one
          ATR beyond entry), not &ldquo;when it feels strong.&rdquo;
        </li>
        <li>
          <strong>Size of each add relative to the first</strong> — decreasing, with the ratio
          fixed in advance, not decided trade by trade.
        </li>
        <li>
          <strong>Maximum number of adds</strong> — a hard cap, so the position can&apos;t keep
          growing as long as the move keeps going.
        </li>
        <li>
          <strong>Stop management on the combined position</strong> — whether the stop moves to
          protect the earlier entries as new ones are added, and to where.
        </li>
      </ul>
      <p>
        Without the fourth one, the first three don&apos;t matter much. A pyramid with a disciplined
        entry schedule and no plan for the stop on the combined position still has unlimited
        downside riding on a single reversal — the entries were sized carefully, the exit wasn&apos;t
        sized at all.
      </p>

      <h2>Why the risk number on a pyramided trade is easy to misstate</h2>
      <p>
        &ldquo;I risked 1% on that trade&rdquo; is usually true of the first entry and false of the
        position as a whole. Three adds at 1%, 0.5% and 0.25% of account risk, each measured
        against its own stop, don&apos;t sum to 1% — and if the stop on the combined position
        is wider than any single entry&apos;s original stop (which it often is, once it&apos;s
        been moved to sit behind all three fills), the real risk on the full position can be
        larger than the first entry alone would suggest. The number that matters is the one
        computed from total size against the stop that&apos;s actually live once the pyramid is
        complete, not the number attached to entry one.
      </p>

      <h2>Checking a pyramid after the fact instead of trusting the memory of it</h2>
      <p>
        This is exactly the kind of trade that&apos;s hard to grade from memory, because by the time
        it closes it&apos;s been through two or three decisions, each one made while already in
        profit and already biased toward adding more. A trade log that only keeps the final
        average price and total size collapses that history into one line and loses the thing
        worth reviewing — whether each add actually met its trigger, or whether the second and
        third entries got looser as the position grew.{" "}
        <Link href="/features/trading-journal">getALPHA</Link> keeps every fill from MT5 as its own
        entry instead of netting them into one average, so a three-fill pyramid stays visible as
        three separate decisions with three separate stops. That&apos;s the detail{" "}
        <Link href="/features/ai-trade-coach">getALPHA&apos;s AI coach</Link> needs to tell a planned
        scale-in from a position that grew because it was winning and nobody had decided when to
        stop adding.
      </p>
    </BlogPost>
  );
}
