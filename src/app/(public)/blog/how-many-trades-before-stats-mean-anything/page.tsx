import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: { absolute: "How Many Trades Before Your Statistics Mean Anything · getALPHA" },
  description:
    "A win rate or an expectancy number computed from 12 trades is mostly noise. Roughly how much sample size you actually need before it starts describing your edge instead of your luck.",
  alternates: { canonical: "/blog/how-many-trades-before-stats-mean-anything" },
};

export default function Page() {
  return (
    <BlogPost title="How Many Trades Before Your Statistics Mean Anything" date="2026-08-17">
      <p>
        Twelve trades, eight winners, a 67% win rate — and a strong temptation to conclude the
        strategy works. It might. It also might be a coin that came up heads eight times in a row,
        which happens more often than it feels like it should. The number itself does not tell you
        which one you are looking at. The sample size is what tells you how much to trust the
        number.
      </p>

      <h2>Why small samples lie in a specific direction</h2>
      <p>
        The problem is not that small samples are wrong on average — it is that they are wrong with
        confidence. A strategy with a true 50% win rate will, over any given run of 20 trades,
        regularly print a run of 65% or 35% just from variance. Over 20 trades that swing is normal.
        Over 500 trades, a strategy that is actually 50-50 will almost never sit at 65% for long —
        the noise gets diluted by volume. The win rate does not become more true as the sample
        grows; the noise around it shrinks, and what is left is closer to the real number.
      </p>
      <p>
        This is why two traders can run the same setup and one calls it a winning strategy after a
        good week while the other calls it broken after a bad one. Neither has enough trades to know
        yet. Both are reading variance and calling it signal.
      </p>

      <h2>A rough number to work with</h2>
      <p>
        There is no single trade count where a strategy suddenly becomes provably good — statistical
        confidence is a curve, not a switch. But as a working floor: below 30 trades, treat any win
        rate or expectancy figure as directional at best, not a verdict. Between 30 and 100, the
        number is worth watching but still wide enough that a handful of trades can swing it several
        points. Past 100, particularly if the results hold up across different market conditions,
        the number starts to describe the strategy rather than the last few weeks of it.
      </p>
      <p>
        The reason 30 shows up so often as a rough floor is that it is where the underlying
        distribution of outcomes starts behaving predictably enough for the average to stop jumping
        around on every new data point — not because trade 31 is magically different from trade 29.
        Treat it as a floor to clear, not a target to stop at.
      </p>

      <h2>Reward-to-risk needs a larger sample than win rate does</h2>
      <p>
        Win rate is a proportion — it converges reasonably fast because every trade is either a win
        or a loss, a simple binary. Average win size and average loss size are not binary; they are
        continuous, and they are much more sensitive to outliers. One trade that runs unusually far
        before getting stopped, or one loss that gaps past a stop-loss, can move an average
        reward-to-risk figure more than a dozen ordinary trades combined. Expectancy — which depends
        on both — inherits that sensitivity, which is why it takes noticeably more trades to trust
        than win rate alone does.
      </p>
      <p>
        In practice this means a strategy can have a stable, believable win rate at 40 trades while
        its expectancy is still bouncing around because one or two outsized trades are doing most of
        the work. Both numbers deserve a sample check before either gets treated as settled.
      </p>

      <h2>Splitting the sample makes the problem worse, not better</h2>
      <p>
        The instinct to slice results — this setup on this pair, this setup in this session, this
        setup after 2pm — is reasonable on its face, but every split divides the sample that was
        already thin. A strategy with 80 trades total might have 12 of them in any one slice, which
        puts every subgroup conclusion back below the floor that made the overall number worth
        trusting in the first place. Segment for ideas worth testing forward, not for conclusions to
        act on immediately.
      </p>

      <h2>What to actually do with a small sample</h2>
      <ul>
        <li>
          <strong>Track the trade count next to every statistic</strong>, not just the statistic
          itself — a win rate without an n attached is not really a number.
        </li>
        <li>
          <strong>Widen the time window before narrowing the trade type</strong> — more history on
          the same setup beats a smaller number of setups.
        </li>
        <li>
          <strong>Treat early results as a hypothesis, not a track record</strong> — a good first 20
          trades is a reason to keep going, not a reason to size up.
        </li>
        <li>
          <strong>Re-check the same statistic after every additional batch of trades</strong> and
          watch whether it is stabilizing or still swinging — a number still moving significantly
          past 100 trades is telling you something about the strategy&apos;s consistency, not just its
          average.
        </li>
      </ul>
      <p>
        None of this replaces having an edge — no amount of sample size turns a losing strategy into
        a winning one. What it does is stop a few lucky or unlucky trades from being mistaken for
        proof either way, which is a mistake that costs real money in both directions: sizing up too
        early on a false positive, or abandoning a sound strategy on a false negative.
      </p>
      <p>
        This is also why a journal needs enough history before its own numbers are worth acting on.{" "}
        <Link href="/features/trading-journal">getALPHA</Link>&apos;s journal keeps the full trade
        count next to every expectancy and win-rate figure it shows, and{" "}
        <Link href="/features/ai-trade-coach">process review</Link> is built to read the decisions
        behind the trades rather than lean on a small-sample outcome number — so the read on a
        strategy does not get decided by whichever dozen trades happened to come first.
      </p>
    </BlogPost>
  );
}
