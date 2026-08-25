import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute: "The Difference Between a Losing Streak and a Broken Strategy · getALPHA",
  },
  description:
    "Seven losses in a row can mean two very different things: normal variance inside a working edge, or a strategy that stopped working. The numbers that tell the two apart, and the one that usually can't.",
  alternates: { canonical: "/blog/losing-streak-vs-broken-strategy" },
};

export default function Page() {
  return (
    <BlogPost
      title="The Difference Between a Losing Streak and a Broken Strategy"
      date="2026-08-25"
    >
      <p>
        Seven losing trades in a row feels like proof that something is wrong. Sometimes it is —
        and sometimes it is exactly what a profitable strategy looks like on a bad week. Both
        produce the same red stretch on the equity curve, and reacting to the wrong one is how a
        working edge gets abandoned right before it was due to pay off, or a broken one gets
        traded for another three months on the strength of &ldquo;it&apos;ll come back.&rdquo;
      </p>

      <h2>Why a losing streak alone tells you nothing</h2>
      <p>
        A strategy with a 40% win rate will produce a run of seven consecutive losses roughly once
        every 45 trades, just from variance — no change in edge required. A strategy with a 55% win
        rate still produces one roughly once every 200 trades. Neither number is rare enough to
        rule out on the basis of the streak&apos;s length by itself. If you only look at
        &ldquo;how many losses in a row,&rdquo; a normal cold stretch and an actual breakdown are
        indistinguishable, because both start the exact same way.
      </p>
      <p>
        This is the reason streak length is a bad trigger for a strategy review on its own. It
        tells you something happened. It does not tell you what.
      </p>

      <h2>What actually changed vs. what is just variance</h2>
      <p>
        The question worth asking isn&apos;t &ldquo;how many losses,&rdquo; it&apos;s
        &ldquo;did the inputs stay the same while the outcome got worse.&rdquo; A few things worth
        checking against the trade record before and during the streak:
      </p>
      <ul>
        <li>
          <strong>Setup criteria</strong> — were the losing trades taken on the same entry
          conditions as the winning ones, or did the criteria quietly loosen once losses started
          piling up? A streak that starts <em>after</em> the rules already drifted is not evidence
          against the original strategy.
        </li>
        <li>
          <strong>Market regime</strong> — did volatility, trend strength, or session behavior
          shift under the strategy? A mean-reversion setup built for range-bound price action will
          lose consistently the moment the market starts trending, and that is a regime change, not
          a broken edge.
        </li>
        <li>
          <strong>Average loss size</strong> — did losses during the streak match the planned
          stop distance, or did they run larger than usual? Bigger-than-planned losses point at
          execution breaking down, which is a different problem from the strategy itself losing its
          edge.
        </li>
        <li>
          <strong>Position size</strong> — did risk per trade stay flat through the streak, or did
          it creep up mid-run trying to recover faster? That pattern turns an ordinary variance
          stretch into a much deeper drawdown, and it&apos;s a sizing failure, not a strategy
          failure.
        </li>
      </ul>
      <p>
        If the setup criteria, regime, and per-trade risk all stayed constant and the losses were
        the size they were supposed to be, the streak is more likely variance. If any of those
        shifted, the streak is a symptom of something else that changed — and fixing that thing is
        a different task than abandoning the strategy.
      </p>

      <h2>The sample-size problem this runs into</h2>
      <p>
        None of the checks above resolve instantly, because distinguishing variance from a broken
        edge is fundamentally a sample-size question — a strategy&apos;s expectancy only becomes
        visible over enough trades to average out. Judging it from the seven trades inside the
        streak alone is the same mistake as judging it from seven winners: neither stretch is long
        enough to mean much by itself.
      </p>
      <p>
        What does move the needle is watching whether the same warning signs — loosened setup
        criteria, larger-than-planned losses, creeping size — show up again the next time drawdown
        hits. A single instance of any of them could be noise. A pattern across multiple streaks is
        no longer a coincidence.
      </p>

      <h2>What to do while you wait for the answer</h2>
      <p>
        The honest position, most of the time, is that you cannot know in the moment which one
        you&apos;re in. What you can control is not making it worse while you find out: keep risk
        per trade at the size it was before the streak started, keep the setup criteria exactly as
        written, and let the sample grow rather than forcing a verdict out of seven data points.
        Cutting size during an uncertain stretch is reasonable. Changing the rules mid-streak
        removes the one piece of information — did the original rules keep working — that would
        have actually answered the question.
      </p>
      <p>
        <Link href="/features/trading-journal">getALPHA</Link> logs setup, stop distance, and
        position size on every synced trade, so a drawdown stretch can be checked against what
        actually changed instead of against memory, and{" "}
        <Link href="/features/ai-trade-coach">the AI coach</Link> flags when sizing or entry
        criteria drift during a losing run — the two failure modes most likely to turn ordinary
        variance into something worse.
      </p>
    </BlogPost>
  );
}
