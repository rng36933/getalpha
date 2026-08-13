import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: { absolute: "Why Your Win Rate Doesn't Matter (And What to Track Instead) · getALPHA" },
  description:
    "A high win rate can hide a broken process, and a low one can hide a sound one. What actually separates a good trading decision from a lucky one.",
  alternates: { canonical: "/blog/why-win-rate-doesnt-matter" },
};

export default function Page() {
  return (
    <BlogPost title="Why Your Win Rate Doesn't Matter (And What to Track Instead)" date="2026-08-07">
      <p>
        Ask most traders how they are doing and they will tell you a percentage: &ldquo;I&apos;m
        winning about 60% of my trades.&rdquo; It is the single most-quoted statistic in trading,
        and on its own it says almost nothing about whether the strategy behind it makes money.
      </p>

      <h2>The math that makes win rate misleading</h2>
      <p>
        A strategy that wins 30% of the time with a 3:1 reward-to-risk ratio is profitable. A
        strategy that wins 70% of the time with a 0.3:1 reward-to-risk ratio loses money. Win rate
        by itself cannot distinguish between them — you need the size of the average win against
        the size of the average loss, which is what <strong>expectancy</strong> actually measures:
      </p>
      <p>
        <em>Expectancy = (win rate × average win) − (loss rate × average loss)</em>
      </p>
      <p>
        A trader chasing a higher win rate alone will often do it by cutting winners short and
        letting losers run — closing profitable trades early feels safe, and giving a loser &ldquo;room
        to come back&rdquo; avoids admitting it was wrong. Both habits push the win rate up while
        quietly wrecking the reward-to-risk ratio that expectancy actually depends on.
      </p>

      <h2>Outcome and decision quality are not the same thing</h2>
      <p>
        A trade sized at 5% risk with no stop-loss that happens to close in profit was not a good
        decision — it was a bad decision that got lucky. A trade sized at 1% risk with a stop set
        before entry that gets stopped out was not a bad decision — it was a sound one that didn&apos;t
        work out this time. Grading trades purely on their outcome rewards the first one and
        punishes the second, which teaches exactly the wrong lesson over enough repetitions.
      </p>
      <p>
        This is the actual argument for journaling in the first place: not to produce a scoreboard,
        but to separate the two. Over a large enough sample, a sound process with a positive
        expectancy wins. A single lucky trade or a single unlucky one tells you almost nothing on
        its own.
      </p>

      <h2>What to track instead</h2>
      <ul>
        <li>
          <strong>Expectancy</strong>, computed from your actual average win and average loss —
          not assumed from a strategy&apos;s theoretical backtest.
        </li>
        <li>
          <strong>Risk consistency</strong> — whether position size stayed within a defined range,
          or crept up after a losing streak.
        </li>
        <li>
          <strong>Stop discipline</strong> — whether a stop-loss was set before entry on every
          trade, not just the ones that needed it.
        </li>
        <li>
          <strong>Planned vs. actual reward-to-risk</strong> — whether exits matched the plan, or
          drifted based on how the trade felt in the moment.
        </li>
      </ul>
      <p>
        None of these show up in a win rate. All four show up in a journal that records the
        decision alongside the result.
      </p>

      <h2>Why this is hard to see in your own numbers</h2>
      <p>
        Reviewing your own process objectively is difficult precisely because you already know how
        each trade turned out — a losing trade is easy to second-guess even when the decision
        behind it was sound, and a winning trade is easy to wave through even when it was reckless.{" "}
        <Link href="/features/ai-trade-coach">getALPHA</Link>&apos;s process review is built around that specific problem:
        it judges sizing, stop placement and exit discipline against your own trading history,
        computed from the numbers first, so the read on a trade doesn&apos;t depend on knowing how it
        ended before judging how it was taken.
      </p>
    </BlogPost>
  );
}
