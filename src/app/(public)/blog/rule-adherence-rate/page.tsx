import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "Rule Adherence Rate: A Number That Matters More Than Your Win Rate · getALPHA",
  },
  description:
    "Win rate measures how the market treated your trades. Rule adherence rate measures whether you actually traded your plan. Only one of them is something you control.",
  alternates: { canonical: "/blog/rule-adherence-rate" },
};

export default function Page() {
  return (
    <BlogPost
      title="Rule Adherence Rate: A Number That Matters More Than Your Win Rate"
      date="2026-10-06"
    >
      <p>
        Win rate answers &ldquo;how often did I get paid.&rdquo; It doesn&apos;t answer the
        question that actually determines whether a strategy survives: did the trades that got
        taken look like the trades the plan describes? A trader can win 60% of the time while
        breaking their own rules on half of those wins, and a trader can win 40% of the time
        while following their rules on every single trade. Rule adherence rate is the number that
        tells the two apart.
      </p>

      <h2>What rule adherence rate actually is</h2>
      <p>
        It&apos;s simple to define and tedious to track by hand: the percentage of trades that
        satisfied every rule in the plan — entry signal, position size, stop-loss placement, exit
        criteria — at the time they were taken. Not graded after the fact, and not graded on
        whether the trade worked out. A trade that followed every rule and lost is 100%
        adherence. A trade that broke the sizing rule and won anyway is still a broken trade.
      </p>
      <p>
        <em>Rule adherence rate = (trades that followed the plan ÷ total trades) × 100</em>
      </p>
      <p>
        The reason this number gets skipped in most journals is that it requires writing the rule
        down before the trade, not describing it afterward. A plan that only exists as a general
        feeling (&ldquo;I trade breakouts with good risk management&rdquo;) can&apos;t be checked
        against anything — every trade can be rationalized as fitting it. A plan with specific,
        falsifiable rules (&ldquo;enter only after a close above the prior session high, risk
        capped at 1%, stop below the breakout candle&rdquo;) produces a yes-or-no answer for every
        trade, every time.
      </p>

      <h2>Why outcome and adherence diverge, and why that&apos;s the useful part</h2>
      <p>
        Over a small sample, a trader can break rules and still come out ahead — oversized
        positions can win, stops moved further away can avoid getting hit, entries taken early
        can catch a move anyway. None of that shows up as a problem in P&amp;L. It shows up as a
        falling adherence rate while the account curve still looks fine, which is exactly the
        window where a bad habit gets reinforced instead of caught. By the time it costs money,
        it&apos;s not a new habit anymore — it&apos;s the one being traded.
      </p>
      <p>
        The reverse case matters just as much. A trader who follows every rule through a losing
        stretch has not found a reason to change anything — they&apos;ve found a sample of trades
        that didn&apos;t work, taken correctly. Mixing up a low adherence rate with a bad stretch,
        or a high adherence rate with a good one, is how traders end up &ldquo;fixing&rdquo; a
        plan that was never actually broken, or sticking with execution that was broken the whole
        time because the P&amp;L happened to cover for it.
      </p>

      <h2>Where it actually breaks down</h2>
      <p>
        A single adherence percentage across months of trades hides more than it shows. The number
        is only useful split by which part of the plan it&apos;s measuring:
      </p>
      <ul>
        <li>
          <strong>Entry adherence</strong> — trades taken at the defined signal versus trades
          taken early on anticipation or late after confirmation had already passed.
        </li>
        <li>
          <strong>Sizing adherence</strong> — position size within the planned risk range, not
          scaled up after a win or a loss.
        </li>
        <li>
          <strong>Stop adherence</strong> — a stop placed before entry at the planned distance,
          not widened once the trade was already open.
        </li>
        <li>
          <strong>Exit adherence</strong> — closed at the planned target or planned invalidation,
          not cut early out of nerves or held past the plan hoping for more.
        </li>
      </ul>
      <p>
        A trader sitting at 90% overall adherence but 60% on stop adherence has one specific,
        fixable problem, not a general discipline issue. That specificity is the entire value of
        breaking the number apart — it points at the one rule actually getting broken instead of
        a vague sense that something isn&apos;t working.
      </p>

      <h2>What to do once you have the number</h2>
      <p>
        A single week of low adherence after a string of losses is a response to a stretch of bad
        trades, not evidence the plan is wrong — reacting to the market by second-guessing size or
        moving stops is a predictable response to pressure, and it&apos;s worth naming without
        necessarily rewriting the rulebook over it. A sustained decline over a month or more is
        different: it usually means either the plan has drifted away from how the trader actually
        wants to operate, or the trader has drifted away from a plan that was fine. Which one it
        is matters, because the fix is opposite — rewrite the plan, or get back to following it.
      </p>

      <h2>Why this is hard to track without a system</h2>
      <p>
        Grading adherence trade by trade requires the plan&apos;s rules to exist somewhere checkable,
        and it requires someone to compare each closed trade against them honestly, which is the
        same problem as grading your own decisions: hindsight makes a broken rule look reasonable
        once the trade worked, and makes a followed rule look wrong once it didn&apos;t.{" "}
        <Link href="/features/trading-journal">getALPHA</Link>&apos;s journal keeps size, stop
        placement and entry timing recorded from the actual trade, and{" "}
        <Link href="/features/ai-trade-coach">the AI coach</Link> checks them against your own
        history rather than how the trade turned out — so adherence gets measured against the
        rule, not against the result.
      </p>
    </BlogPost>
  );
}
