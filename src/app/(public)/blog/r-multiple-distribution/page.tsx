import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "R-Multiple Distribution: Why Your Average Hides the Trades That Actually Made You Money · getALPHA",
  },
  description:
    "Average R-multiple is one number computed from a spread that usually isn't symmetric. What the distribution behind it looks like, and why the average alone can't tell you if the edge is real.",
  alternates: { canonical: "/blog/r-multiple-distribution" },
};

export default function Page() {
  return (
    <BlogPost
      title="R-Multiple Distribution: Why Your Average Hides the Trades That Actually Made You Money"
      date="2026-09-30"
    >
      <p>
        &ldquo;My average R is +0.4&rdquo; sounds like a clean, single-number summary of a
        strategy&apos;s edge. It is a summary — of a spread of outcomes that, for most strategies,
        is not symmetric and not evenly distributed around that number. A handful of large winners
        can produce a positive average sitting on top of a majority of losing trades, and a handful
        of large losers can produce a negative average sitting on top of a majority of winners. The
        average alone cannot tell you which one you&apos;re looking at.
      </p>

      <h2>What the average actually collapses</h2>
      <p>
        Average R-multiple is the sum of every trade&apos;s result, expressed as a multiple of its
        initial risk, divided by the number of trades. That single division is where the shape of
        the data disappears. A strategy with 40 trades at −1R, 55 trades at +0.3R, and 5 trades at
        +6R produces a positive average — and looks, from that one number, similar to a strategy
        where 70 of 100 trades land near +0.5R with no large outliers at all. Those are two
        completely different trading styles with different failure modes, and the average makes
        them indistinguishable.
      </p>

      <h2>Mean vs. median: the fastest skew check</h2>
      <p>
        The gap between the mean R-multiple and the median R-multiple is the cheapest signal that
        the distribution is skewed. If the mean is comfortably above the median, the average is
        being pulled up by a small number of outsized winners, and most individual trades are
        below what the headline number implies. If the two are close, the results are more evenly
        spread and the average is a fair description of a typical trade.
      </p>
      <p>
        <em>Skew signal = mean R − median R</em>
      </p>
      <p>
        Neither number is wrong on its own — a strategy that&apos;s built around occasional large
        wins and frequent small losses is a legitimate style, sometimes called a trend-following
        or breakout profile. The problem isn&apos;t having that shape. It&apos;s not knowing you
        have it, and grading day-to-day performance against an average that only a rare trade type
        actually produces.
      </p>

      <h2>Why the shape changes what a losing streak means</h2>
      <p>
        A strategy with a right-skewed distribution — most trades small losses or small wins, a few
        large winners carrying the average — will produce long stretches where every closed trade
        looks unprofitable, simply because the trades that make the strategy work are rare by
        design. Judging that strategy by its last 15 trades, without knowing the distribution it
        was built on, looks exactly like judging a broken strategy. The opposite shape — most
        trades clustered near a small positive R with a few sharp losers — will look great for long
        stretches and then give back weeks of gains in one or two trades that were always part of
        the distribution, not a sign something suddenly broke.
      </p>
      <p>
        Neither read is available from the average. Both are visible immediately once the
        individual R-multiples are plotted instead of collapsed.
      </p>

      <h2>What to actually look at</h2>
      <ul>
        <li>
          <strong>A histogram of R-multiples</strong>, not a running average — bucket every closed
          trade by its result and look at the shape, not a single point estimate of it.
        </li>
        <li>
          <strong>The contribution of the top decile</strong> — what share of total R came from the
          best 10% of trades. A strategy where the top 10% of trades account for most of the
          positive R is not the same strategy as one where returns are spread evenly, even if the
          averages match.
        </li>
        <li>
          <strong>The worst single trade as a share of total R</strong> — the mirror question for
          the loss side: how much of the account&apos;s progress one bad trade can erase.
        </li>
        <li>
          <strong>Median R alongside mean R</strong>, every time the average is quoted — the two
          together take a few seconds to compare and immediately flag skew the average hides.
        </li>
      </ul>

      <h2>Reading the distribution, not the number</h2>
      <p>
        A distribution bunched tightly around a small positive median with a short right tail is a
        strategy that wins often and rarely by much — expectancy comes from frequency, and a string
        of losses is more likely to mean something changed. A distribution with a long right tail
        and a median near zero or slightly negative is a strategy that wins rarely and big —
        expectancy comes from the tail, and a string of small losses is the strategy working
        exactly as designed, not a signal to abandon it. Neither shape is right or wrong in the
        abstract. Trading one as if it were the other — cutting winners early because the average
        says +0.4R is &ldquo;enough,&rdquo; when the whole edge lives in the rare trade that runs
        to +6R — is where the distribution actually costs money.
      </p>

      <h2>Why this is hard to keep straight from memory</h2>
      <p>
        Recalling which recent trades were the small grinding wins and which were the rare large
        ones is not something most traders can do accurately after a few dozen trades, and a broker
        statement totals P&amp;L, not R-multiples bucketed by size. Seeing the actual shape of a
        strategy&apos;s results means computing R for every trade against its own initial risk and
        plotting the full set, not the running average.{" "}
        <Link href="/features/trading-journal">getALPHA</Link> computes R-multiple for every
        logged trade automatically and keeps the full distribution alongside the summary stats, so
        the question isn&apos;t &ldquo;what&apos;s my average R&rdquo; but &ldquo;what does my
        average R actually come from&rdquo; — and that answer is what tells you whether a losing
        stretch is noise or a warning.
      </p>
    </BlogPost>
  );
}
