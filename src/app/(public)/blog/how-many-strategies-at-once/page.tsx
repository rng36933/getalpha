import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute: "How Many Strategies Should You Actually Be Running at Once? · getALPHA",
  },
  description:
    "Running several strategies feels like diversification. Usually it just splits your sample size, hides which one is actually working, and doubles the number of rules you have to follow under pressure.",
  alternates: { canonical: "/blog/how-many-strategies-at-once" },
};

export default function Page() {
  return (
    <BlogPost
      title="How Many Strategies Should You Actually Be Running at Once?"
      date="2026-09-19"
    >
      <p>
        Running three or four strategies at once feels like the responsible version of trading —
        spread across setups, not dependent on any single edge. In practice, most traders running
        that many aren&apos;t diversified. They&apos;re running one account-sized sample split four
        ways, with no single strategy generating enough trades to tell them anything, and no way to
        tell which one is actually carrying the results.
      </p>

      <h2>What &ldquo;running a strategy&rdquo; has to mean</h2>
      <p>
        A strategy is a fixed set of entry conditions, exit conditions and sizing rules — not a
        general approach or a favorite indicator. &ldquo;I trade breakouts&rdquo; isn&apos;t a
        strategy in the sense that matters here; it&apos;s a category that could contain five
        different rule sets with five different expectancies. If two &ldquo;strategies&rdquo; in
        your journal share the same entry trigger and only differ in which pair they&apos;re applied
        to, that&apos;s one strategy with two instruments, not two strategies — and it should be
        graded as one.
      </p>
      <p>
        This distinction matters because the whole cost of running multiple strategies is a sample
        size cost, and sample size is counted per distinct rule set, not per label in a dropdown.
      </p>

      <h2>The sample size problem</h2>
      <p>
        A strategy needs on the order of several dozen trades before its win rate and expectancy
        stop being mostly noise. Split 100 trades a month across four strategies and each one gets
        25 — not enough to distinguish a working edge from a string of variance for another two or
        three months. Run one strategy and the same 100 trades tell you something meaningful in
        weeks. The number of strategies you run is a direct, compounding tax on how fast any of them
        becomes provable.
      </p>
      <p>
        This is the part that&apos;s easy to miss because it doesn&apos;t look like a cost in the
        moment — every individual trade still gets taken and logged. The cost shows up months later,
        as four strategies that each still look &ldquo;too early to tell,&rdquo; indefinitely.
      </p>

      <h2>Correlation collapses the count that matters</h2>
      <p>
        Four strategies traded on the same pair, in the same session, off the same higher-timeframe
        trend aren&apos;t four independent sources of return — they&apos;re four ways of expressing
        one market view, and they tend to win together and lose together. The number that actually
        describes your diversification isn&apos;t how many strategies you run; it&apos;s how many of
        them would have a losing day on the same day. If the answer is &ldquo;usually all of
        them,&rdquo; you&apos;re not running four strategies. You&apos;re running one, with four
        entry triggers, at four times the position count.
      </p>

      <h2>The execution cost nobody counts</h2>
      <p>
        Each strategy has its own entry rules, its own stop logic, its own management rules for when
        a trade goes against you. Holding four of those correctly, in real time, under the pressure
        of an open position, is a materially harder job than holding one — and the failure mode
        isn&apos;t usually catastrophic, it&apos;s a slow rule-bleed: applying strategy B&apos;s exit
        rule to a strategy A trade because it&apos;s the one you executed most recently, or sizing a
        low-conviction setup the same as a high-conviction one because tracking four separate sizing
        rules stopped happening somewhere around strategy three. None of that shows up as an obvious
        mistake. It shows up as results that are worse than any individual strategy&apos;s backtest,
        with no clear reason why.
      </p>

      <h2>What to check before adding another one</h2>
      <ul>
        <li>
          <strong>Trade count per strategy, not per account.</strong> If any strategy you&apos;re
          running has fewer than 30–40 logged trades, adding another one doesn&apos;t diversify
          anything — it just adds a fifth number that also isn&apos;t provable yet.
        </li>
        <li>
          <strong>Same-day loss overlap between strategies.</strong> Pull the days each strategy lost
          money and check how often they overlap. High overlap means the strategies are correlated
          regardless of how different their entry logic looks on paper.
        </li>
        <li>
          <strong>Rule-mixing errors, tagged as their own category.</strong> Wrong exit rule applied,
          wrong sizing formula used — logged explicitly instead of folded into &ldquo;execution
          error&rdquo; in general. If this count rises with each strategy added, that&apos;s the
          direct cost of running one more than you can actually hold in your head.
        </li>
        <li>
          <strong>Whether a losing strategy is still running because of its own numbers, or because
          stopping it feels like admitting the whole multi-strategy setup was the wrong call.</strong>{" "}
          Those are different reasons, and only one of them is a reason to keep trading it.
        </li>
      </ul>

      <h2>The practical answer</h2>
      <p>
        There&apos;s no fixed number that&apos;s right for every account size and trade frequency,
        but the constraint is the same for everyone: run as many strategies as you can hold to full,
        correct execution and still get each one to a meaningful sample size inside a timeframe
        you&apos;re willing to wait. For most discretionary traders placing a handful of trades a
        day, that ceiling is lower than the number of setups they&apos;ve read about and want to try.
        Adding a strategy should feel like a decision that costs something — because it does, in
        sample size and in execution accuracy — not like a free way to diversify.
      </p>
      <p>
        Seeing this requires tagging every trade with which strategy it belongs to and keeping the
        per-strategy numbers separate instead of blended into one account-level total.{" "}
        <Link href="/features/trading-journal">getALPHA</Link>&apos;s journal keeps that breakdown
        per strategy automatically, and <Link href="/features/ai-trade-coach">the process
        review</Link> can flag when a rule from one strategy shows up applied to a trade logged under
        another — the rule-bleed that a blended total never surfaces on its own.
      </p>
    </BlogPost>
  );
}
