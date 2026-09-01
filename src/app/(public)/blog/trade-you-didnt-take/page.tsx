import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "The Trade You Didn't Take: Why Missed Setups Deserve a Journal Entry Too · getALPHA",
  },
  description:
    "A journal built from closed trades only sees the setups that got taken. The ones that got skipped never generate a row — and that's exactly why they're worth writing down.",
  alternates: { canonical: "/blog/trade-you-didnt-take" },
};

export default function Page() {
  return (
    <BlogPost
      title="The Trade You Didn't Take: Why Missed Setups Deserve a Journal Entry Too"
      date="2026-09-01"
    >
      <p>
        A trader closes 40 trades in a month and reviews all 40. The setup that lined up exactly
        as planned and got skipped — because it was the third one that day and felt like a trap,
        because a phone call ran long, because the trigger candle closed and the hand just didn&apos;t
        move — gets reviewed by nobody. It never generated a fill, so it never generated a row.
        A journal built only from closed trades has a blind spot exactly the shape of every trade
        that didn&apos;t happen.
      </p>

      <h2>What a journal never sees</h2>
      <p>
        Any journal, automatic or manual, is built from execution: an order goes in, a position
        closes, a row gets written. That is the correct source of truth for what a strategy
        actually did in an account. It says nothing about what the strategy&apos;s rules produced —
        every setup that met the criteria, whether or not a trade followed. The gap between those
        two lists is invisible in P&amp;L, invisible in win rate, invisible in every number a
        journal normally reports, because none of those numbers are computed from trades that
        never existed.
      </p>

      <h2>Two very different reasons for a miss</h2>
      <p>
        Not every skipped setup is a mistake, which is exactly why lumping them together is a
        problem. There are two distinct categories, and confusing them teaches the wrong lesson:
      </p>
      <ul>
        <li>
          <strong>Correctly declined</strong> — it looked similar to the setup at a glance, but on
          closer inspection it didn&apos;t actually meet the criteria: wrong session, no
          confirmation, risk already at its cap for the day. Skipping this one was the process
          working.
        </li>
        <li>
          <strong>Hesitation</strong> — it met every criterion the strategy calls for, and it was
          skipped anyway, for a reason that has nothing to do with the setup: two losses in a row
          made the next signal feel unsafe, or the size required felt too large in the moment.
          This is the process failing to execute itself.
        </li>
      </ul>
      <p>
        Without a record, both categories collapse into the same memory: &ldquo;I didn&apos;t take
        it.&rdquo; A trader who only remembers hesitation as regret starts forcing marginal setups
        to avoid the feeling of missing out. A trader who never separates the two never notices
        that hesitation is clustering around a specific condition — after a loss, in a specific
        pair, at a specific size — because nothing was written down at the time to cluster.
      </p>

      <h2>What it costs when it isn&apos;t tracked</h2>
      <p>
        A strategy backtested on every valid signal has one expectancy. The same strategy, traded
        with a chunk of its signals skipped by hesitation, has a different one — usually worse,
        because the setups most likely to get skipped are the larger or more uncomfortable ones,
        not a random sample. A trader who never logs the misses is comparing their live results
        against a backtest that assumes a discipline they aren&apos;t actually applying, and the
        gap between the two gets blamed on the market instead of on the pattern of what got
        skipped.
      </p>
      <p>
        There is a second-order cost too. A missed setup that runs to a big winner without the
        trader in it produces a very specific kind of pain, and the next signal after that one
        gets taken late, oversized, or outside the plan entirely — chasing the entry that was
        already gone. The trade that wasn&apos;t taken doesn&apos;t stay contained to itself; it
        frequently shows up as a worse decision on the trade that follows it.
      </p>

      <h2>What to log for a missed setup</h2>
      <ul>
        <li>
          <strong>Instrument, direction, and time</strong> — the same basics as any executed
          trade.
        </li>
        <li>
          <strong>What the entry, stop, and target would have been</strong>, so an approximate R
          can be worked out later, once the outcome is known.
        </li>
        <li>
          <strong>Why it was skipped</strong>, in one honest line — &ldquo;didn&apos;t meet
          criteria&rdquo; is a different entry than &ldquo;spooked after the last loss.&rdquo;
        </li>
        <li>
          <strong>Which category it was</strong> — correctly declined, or hesitation — decided
          against the rules, not against how it turned out.
        </li>
      </ul>
      <p>
        The point isn&apos;t to grade every miss by whether the trade would have won. A hesitation
        skip on a setup that would have lost is still a hesitation skip, and it will show up again
        on a setup that wins if the pattern behind it isn&apos;t seen.
      </p>

      <h2>Why this is easy to skip</h2>
      <p>
        A broker only has something to report once an order fills — there is nothing for a
        platform to sync when nothing was placed, and no add-on can read a trade that never
        happened. That makes the missed-setup line the one part of a journal that still has to be
        written by hand, right when it happens, before the reason blurs into a vague
        &ldquo;didn&apos;t feel right.&rdquo; <Link href="/features/trading-journal">getALPHA</Link>{" "}
        syncs every closed trade automatically and prompts for a note on it, which is the natural
        place to keep the missed ones too — logged next to the trades that did happen, so a
        session review in{" "}
        <Link href="/features/ai-trade-coach">the AI coach</Link> isn&apos;t reading only the half
        of the story that got executed.
      </p>
    </BlogPost>
  );
}
