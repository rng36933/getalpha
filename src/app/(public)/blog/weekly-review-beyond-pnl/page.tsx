import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "The Weekly Review: What Actually Belongs in It Besides P&L · getALPHA",
  },
  description:
    "Most weekly reviews are a single number checked on Friday: up or down. Here's what a review actually needs to contain to change anything the following week.",
  alternates: { canonical: "/blog/weekly-review-beyond-pnl" },
};

export default function Page() {
  return (
    <BlogPost
      title="The Weekly Review: What Actually Belongs in It Besides P&L"
      date="2026-10-05"
    >
      <p>
        Ask a trader what their weekly review looks like and most describe the same thing: open
        the account, check whether the week was green or red, maybe glance at the biggest win and
        the biggest loss, close the tab. That takes ninety seconds and changes nothing about how
        the next week gets traded, because a single number for five days of trading can&apos;t
        point at a specific habit to fix. A review that&apos;s actually worth the time produces at
        least one concrete thing to do differently on Monday. P&amp;L alone never does.
      </p>

      <h2>Why the weekly total is the least useful number in it</h2>
      <p>
        A week&apos;s P&amp;L collapses dozens of separate decisions — entries, sizes, stops,
        exits, trades skipped, trades forced — into one figure that any of them could have moved
        in either direction. A green week can be three disciplined trades and one lucky oversized
        one that happened to work. A red week can be five trades taken exactly to plan that simply
        ran into a bad stretch of price action. The total tells you which of those weeks felt
        better. It doesn&apos;t tell you which one you should actually repeat.
      </p>

      <h2>What the review needs instead</h2>
      <p>
        None of this requires new data — it requires looking at the same week&apos;s trades
        through a few more lenses than one:
      </p>
      <ul>
        <li>
          <strong>Expectancy, not just total P&amp;L</strong> — the average result per trade
          relative to risk taken, so a week with one outsized winner doesn&apos;t get mistaken for
          five good decisions.
        </li>
        <li>
          <strong>Sizing consistency</strong> — whether risk per trade stayed in the planned range
          across the week, or crept up after Tuesday&apos;s losses and never came back down.
        </li>
        <li>
          <strong>Entries and exits against the plan</strong> — how many trades were taken at the
          actual signal and closed on the actual rule, versus how many drifted in either direction
          once the trade was already open.
        </li>
        <li>
          <strong>Setups that were skipped</strong> — valid signals the strategy produced that
          didn&apos;t get taken, and why. A review built only from closed trades never sees these,
          and they&apos;re often where the real pattern is.
        </li>
        <li>
          <strong>Where in the week the trades clustered</strong> — a single day carrying most of
          the week&apos;s volume, or most of its losses, is a different finding than the same
          numbers spread evenly across five sessions.
        </li>
      </ul>

      <h2>One bad day is not one bad week</h2>
      <p>
        A review done at the week level instead of the day level catches something a daily
        glance misses: a single rough Tuesday that gets revenge-traded into a rough Wednesday
        looks, day by day, like two separate bad sessions. Looked at as a week, it&apos;s one
        decision — not resetting after the first loss — that cost two days instead of one. The
        fix isn&apos;t &ldquo;trade better on Wednesdays.&rdquo; It&apos;s noticing that the second
        bad day only existed because of the first.
      </p>

      <h2>Comparing the week to your own baseline, not to zero</h2>
      <p>
        &ldquo;Was this week profitable&rdquo; is the wrong question to anchor a review around,
        because a single week is usually too short a sample to mean much on its own. The more
        useful comparison is this week against your own trailing average: more trades than usual,
        or fewer; tighter adherence to planned size, or looser; a cluster of setups outside the
        strategy&apos;s normal hours, or not. A week that lost money but matched every other
        metric to the baseline is variance. A week that made money but shows size creeping up and
        entries getting earlier is a warning wearing a green number.
      </p>

      <h2>What a weekly review should actually produce</h2>
      <p>
        A review that ends with &ldquo;okay, decent week&rdquo; hasn&apos;t done anything a glance
        at the balance couldn&apos;t. A review worth the fifteen minutes ends with one specific,
        checkable statement — &ldquo;size crept up after the Tuesday loss and stayed up for the
        rest of the week,&rdquo; &ldquo;three of the four losses were entries taken before the
        signal actually confirmed,&rdquo; &ldquo;the two skipped setups on Thursday would have been
        the best trades of the week.&rdquo; That statement is the thing to watch for next week.
        Without it, the review is just a slower way of reading the same P&amp;L number you already
        saw on the dashboard.
      </p>

      <h2>Why this is hard to do from memory</h2>
      <p>
        By Friday, a week of trades has already been smoothed over by how it felt to live through
        — a rough Tuesday fades once Thursday goes well, and a string of correct decisions gets
        undersold if the week still ended red. Pulling expectancy, sizing consistency and skipped
        setups apart from a week&apos;s worth of trades by hand is also just tedious enough that it
        rarely happens past the first couple of weeks of good intentions.{" "}
        <Link href="/features/trading-journal">getALPHA</Link> keeps the full week&apos;s trades,
        sizing and skipped setups in one place as they happen, and{" "}
        <Link href="/features/ai-trade-coach">the AI coach</Link> surfaces the pattern — the
        creeping size, the early entries, the cluster of losses on one day — so the weekly review
        starts from a specific finding instead of a blank screen and a P&amp;L figure.
      </p>
    </BlogPost>
  );
}
