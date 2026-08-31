import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute: "Leverage Isn't the Risk — How You Use It Is · getALPHA",
  },
  description:
    "500:1 leverage and 2:1 leverage can produce the exact same risk on a trade, or wildly different ones. The number on the account label tells you almost nothing on its own — what you do with it tells you everything.",
  alternates: { canonical: "/blog/leverage-isnt-the-risk" },
};

export default function Page() {
  return (
    <BlogPost title="Leverage Isn't the Risk — How You Use It Is" date="2026-08-31">
      <p>
        &ldquo;High leverage is dangerous&rdquo; is one of those trading warnings that&apos;s true
        often enough to sound like a law, and vague enough to be mostly useless. Leverage doesn&apos;t
        put a trade at risk by existing. It puts a trade at risk when it&apos;s used to size a
        position past what the stop-loss and the account can actually absorb. Two traders on the
        same 1:500 account can take on completely different amounts of risk, and the leverage ratio
        alone won&apos;t tell you which one is which.
      </p>

      <h2>What leverage actually changes</h2>
      <p>
        Leverage changes how much capital a broker requires you to put down to open a position of a
        given size — it&apos;s a margin mechanic, not a risk setting. It determines how large a
        position you&apos;re <em>able</em> to open with a given account balance. It says nothing
        about how large a position you <em>should</em> open, and it says nothing at all about where
        your stop-loss sits. Those two decisions — position size and stop distance — are what
        actually determine how much of the account is at risk on a trade. Leverage just removes the
        capital ceiling that would otherwise cap how far those two decisions could go.
      </p>
      <p>
        This is why the same leverage ratio can sit behind a controlled trade or a reckless one. A
        trader risking 1% of the account per trade, with a stop set at a sensible technical level,
        is taking the same dollar risk whether the account offers 1:30 leverage or 1:500 — leverage
        just changes how much margin gets locked up to hold that position, not how much is lost if
        the stop is hit. The trader who blows up an account on high leverage almost never does it
        because the leverage number was high. They do it because the position was sized as if the
        margin requirement, not the stop distance, was the thing being risked.
      </p>

      <h2>The confusion that causes the damage</h2>
      <p>
        The dangerous move is using the fact that a broker <em>allows</em> a large position as the
        reason to open one. &ldquo;My account lets me open a 5-lot position, so I will&rdquo; treats
        available margin as a sizing method. It isn&apos;t one — it&apos;s a ceiling set by the
        broker for an entirely different purpose, and it has no relationship to the account&apos;s
        risk tolerance, the setup&apos;s stop distance, or the trader&apos;s actual edge. Sizing a
        position off available margin instead of off the stop distance is how a single losing trade
        turns from a 1% dent into a double-digit one, and it&apos;s available at any leverage ratio
        above roughly 1:5 — high leverage just makes it possible to do more of it, faster.
      </p>
      <p>
        The reverse mistake is just as common and less talked about: assuming low leverage makes a
        position automatically safe. A trader on a conservative 1:10 account who sizes a position at
        10% of equity per trade with a wide, undefined stop is running more risk than a trader on
        1:500 leverage sizing at 0.5% with a tight, tested stop. The leverage ratio on the account
        statement doesn&apos;t appear anywhere in either trade&apos;s actual risk — only the position
        size relative to the stop distance does.
      </p>

      <h2>The number that actually matters</h2>
      <p>
        Risk per trade, expressed as a percentage of account equity, is the number leverage gets
        confused for. It&apos;s calculated from the stop distance and the position size, not from
        the margin ratio:
      </p>
      <p>
        <em>Risk % = (position size × stop distance in price) ÷ account equity</em>
      </p>
      <p>
        Two positions with identical leverage exposure can have completely different values here
        depending on where the stop sits. A tight stop lets you size larger for the same dollar risk;
        a wide stop forces a smaller position for the same dollar risk. Leverage never enters the
        equation directly — it only shows up indirectly, as the thing that determines whether the
        broker will let the position open at all.
      </p>

      <h2>What to check in your own trades</h2>
      <ul>
        <li>
          <strong>Risk per trade as a percentage of equity</strong>, computed from position size and
          stop distance — not inferred from the leverage ratio or the margin used.
        </li>
        <li>
          <strong>Whether position size tracks the stop distance</strong> — a wider stop should mean
          a smaller position at the same risk percentage; if position size stays roughly constant
          regardless of stop distance, sizing is being driven by something other than risk.
        </li>
        <li>
          <strong>Margin utilization on the trades that went badly</strong> — if the losses that hurt
          most were also the trades using the most available margin, that&apos;s the &ldquo;because I
          could&rdquo; pattern showing up in the data.
        </li>
        <li>
          <strong>Risk percentage on trades taken after a loss</strong>, compared to the baseline —
          size creeping up here regardless of leverage is a discipline problem leverage will happily
          amplify but didn&apos;t cause.
        </li>
      </ul>
      <p>
        None of this argues for a specific leverage ratio. It argues for treating leverage as a
        capacity limit set by the broker, and treating risk per trade — sized off the stop, not off
        the margin available — as the number that&apos;s actually yours to control.
      </p>

      <h2>Why this is easy to lose track of</h2>
      <p>
        Risk percentage isn&apos;t printed on a trade ticket the way leverage and margin used are, so
        it&apos;s the number that quietly drifts while the visible ones look unchanged.{" "}
        <Link href="/features/trading-journal">getALPHA</Link> pulls position size, stop distance and
        account equity straight from MT5 for every closed trade and computes the actual risk
        percentage taken, rather than leaving it to be estimated after the fact. From there,{" "}
        <Link href="/features/ai-trade-coach">the AI coach</Link> can flag the pattern that matters —
        position size scaling with available margin instead of with the stop — before it shows up as
        an account-ending trade instead of a data point.
      </p>
    </BlogPost>
  );
}
