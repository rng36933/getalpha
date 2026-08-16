import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute: "The Stop-Loss You Set vs. The Stop-Loss You Moved · getALPHA",
  },
  description:
    "A stop decided before entry and a stop dragged wider mid-trade look identical in a P&L column. They are not the same decision, and only one of them is risk management.",
  alternates: { canonical: "/blog/stop-loss-you-set-vs-moved" },
};

export default function Page() {
  return (
    <BlogPost
      title="The Stop-Loss You Set vs. The Stop-Loss You Moved"
      date="2026-08-16"
    >
      <p>
        Two trades close for the same loss. One had a stop placed before entry, at the level that
        invalidated the setup, and it got hit. The other had a stop placed before entry too — but
        somewhere in the middle of the trade it got dragged further away, once, then again, and by
        the time it finally closed the loss was three times the size originally planned. In most
        journals, both trades show up as one row each: instrument, direction, P&amp;L. Identical.
        They are not the same decision, and treating them as the same number is exactly how the
        second habit survives for years without being caught.
      </p>

      <h2>Why the moved stop is invisible by default</h2>
      <p>
        A journal that only logs the stop-loss price at the moment a trade closes cannot tell
        these two trades apart. It sees the final stop, not the first one. The moment where the
        decision actually happened — the point mid-trade where the plan was quietly rewritten —
        leaves no trace unless something was recording before that edit as well as after it. That
        is not a minor gap. It is the single most common way a defined-risk strategy turns into an
        undefined-risk one without the trader ever deciding, on purpose, to change strategy.
      </p>
      <p>
        The reasoning in the moment is rarely reckless-sounding. &ldquo;It just needs a bit more
        room.&rdquo; &ldquo;The level held on the last two touches.&rdquo; &ldquo;I don&apos;t want
        to get stopped out right before it turns.&rdquo; Each one sounds like a market read. What
        it actually is, almost every time, is the original risk decision being replaced by however
        much loss currently feels tolerable to sit with — which is a number that gets larger every
        time it is asked, because the trade is now more expensive to be wrong about than it was
        five minutes ago.
      </p>

      <h2>What moving a stop is actually evidence of</h2>
      <p>
        A stop set before entry is a risk decision made with a clear head, before there is money on
        the line to defend. A stop moved after entry is a decision made under the exact opposite
        conditions — with a loss already open, with the sunk cost of being wrong already felt, and
        with every incentive pointing toward avoiding the discomfort of closing at a loss right
        now. Those are not two versions of the same judgment. The second one is structurally worse
        at the moment it is made, regardless of how the trade eventually turns out.
      </p>
      <p>
        This is also why outcome is the wrong test for it. A moved stop that ends up back in profit
        does not retroactively make the decision sound — it makes it lucky, and luck is exactly
        what teaches the habit to repeat. The trade that would have proven the point, the one where
        moving the stop turned a planned 1R loss into an account-damaging one, is the trade that
        does not get talked about afterward. Only a record that keeps both numbers — the original
        stop and the one it became — makes that asymmetry visible instead of remembered
        selectively.
      </p>

      <h2>What to actually track</h2>
      <ul>
        <li>
          <strong>The stop-loss at entry</strong>, recorded before the trade is placed, not filled
          in afterward from memory.
        </li>
        <li>
          <strong>Every subsequent change to that stop</strong>, in the direction of more room —
          moving a stop closer to lock in profit is a different action and not the one this is
          about.
        </li>
        <li>
          <strong>The gap between planned risk and realized risk</strong> on trades where the stop
          moved, in R or in account percentage, not just in currency.
        </li>
        <li>
          <strong>How often it happens</strong> — a single instance is a bad day; a pattern across
          a month is a hole in the strategy that no amount of good setups will fix.
        </li>
      </ul>
      <p>
        None of this requires guessing at intent. It only requires knowing what the stop actually
        was at two points in time instead of one.
      </p>

      <h2>Why this is hard to catch by hand</h2>
      <p>
        A stop moved manually in a MetaTrader 5 terminal does not announce itself — the platform
        shows the current order, not its history, and a manual spreadsheet only gets updated with
        whatever the trader remembers to write down, which is rarely the moment of the edit
        itself.{" "}
        <Link href="/features/trading-journal">getALPHA</Link> syncs closed trades directly from
        MT5, and the process review in{" "}
        <Link href="/features/ai-trade-coach">getALPHA&apos;s AI coach</Link> checks realized risk
        against what a trade was sized for at entry, so a widened stop shows up as a pattern to
        look at rather than a number that quietly blends into the average.
      </p>
    </BlogPost>
  );
}
