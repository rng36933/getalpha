import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "Kelly Criterion for Retail Traders: Why Full Kelly Is a Bad Idea With Real Money · getALPHA",
  },
  description:
    "The Kelly criterion gives a precise, mathematically optimal position size — if you feed it inputs no retail trader actually has. What full Kelly does to a real account, and what to size instead.",
  alternates: { canonical: "/blog/kelly-criterion-for-retail-traders" },
};

export default function Page() {
  return (
    <BlogPost
      title="Kelly Criterion for Retail Traders: Why Full Kelly Is a Bad Idea With Real Money"
      date="2026-10-02"
    >
      <p>
        The Kelly criterion has a specific appeal: it is not a rule of thumb, it is a formula.
        Feed it your win rate and your reward-to-risk ratio and it returns one number — the
        fraction of your account to risk that maximizes long-run growth. No guessing, no &ldquo;1%
        feels about right.&rdquo; That precision is exactly what makes it dangerous once you notice
        where the two inputs actually come from.
      </p>

      <h2>What the formula is actually asking for</h2>
      <p>
        The common form is <em>f* = p − (q / b)</em>, where <em>p</em> is your probability of
        winning, <em>q</em> is your probability of losing (1 − p), and <em>b</em> is your average
        win divided by your average loss. Plug in a 50% win rate and a 2:1 reward-to-risk ratio and
        Kelly says risk 25% of the account on the next trade. Plug in a 60% win rate at 1:1 and it
        says risk 20%. These are not small numbers, and that is the point — full Kelly is
        aggressive by design, because it is solving for growth rate, not for comfort or survival
        against a run of bad luck.
      </p>
      <p>
        It also assumes something retail traders never actually have: a fixed, known edge. Kelly
        was built for games with a defined probability distribution — a blackjack count, a biased
        coin. A trading edge is not a known quantity handed to you before you sit down. It is an
        estimate, computed after the fact from a limited, noisy sample of your own past trades, and
        that distinction is where full Kelly stops being optimal and starts being reckless.
      </p>

      <h2>The edge you plug in is already wrong</h2>
      <p>
        Say your journal shows a 55% win rate and a 1.3:1 reward-to-risk ratio over your last 80
        trades. That is not your edge — it is a sample statistic with a confidence interval wide
        enough to include &ldquo;barely profitable&rdquo; and &ldquo;clearly losing&rdquo; at the
        same time. <Link href="/blog/how-many-trades-before-stats-mean-anything">Eighty trades is
        not enough</Link> to pin down a win rate precisely, and Kelly has no way to express that
        uncertainty — it treats whatever number you hand it as exact, then sizes as aggressively as
        that number allows.
      </p>
      <p>
        Overestimate your edge even slightly and full Kelly overbets by a lot, because the output
        is sensitive to the inputs in a way that does not scale gently. A real edge of 55% fed into
        the formula as 60% does not produce a position size that is 5% too large — it can produce
        one that is wrong by multiples, because the formula has no cushion built in for being
        wrong about the thing it most depends on.
      </p>

      <h2>What full Kelly does to the account even when the edge is real</h2>
      <p>
        This is the part that surprises people who check the math and find their edge estimate
        actually holds up: full Kelly is still unbearable to trade. A strategy with a genuine,
        stable edge, sized at full Kelly, will still produce drawdowns of 50% or more along the way
        to its theoretical long-run growth rate — that is not a flaw in the estimate, it is what
        the optimal-growth formula looks like in between its good stretches. Kelly optimizes for
        the size of the number at the end of a very long run, not for the size of the number at any
        point before that, and a 50% drawdown happening to a real account attached to a real person
        tends to end the strategy long before the long run arrives.
      </p>

      <h2>Fractional Kelly: what you give up and what you get back</h2>
      <p>
        The standard fix is not a different formula, it is a smaller fraction of the same one.
        Half-Kelly — risking half of what the full formula outputs — gives up roughly a quarter of
        the theoretical growth rate and removes a disproportionate amount of the volatility,
        because growth rate degrades linearly as you scale down from full Kelly, but variance
        degrades faster. Quarter-Kelly gives up more growth but turns a strategy that was
        statistically unsurvivable into one with drawdowns closer to what a real account and a real
        person can sit through without abandoning it at the bottom.
      </p>
      <p>
        That trade-off is the actual decision a retail trader is making, and it has nothing to do
        with being conservative for its own sake — it is pricing in the fact that your edge
        estimate is uncertain, your sample is finite, and your ability to keep trading a strategy
        through its worst stretch is itself part of whether the edge gets realized at all. A
        formula that assumes you will stay in the game no matter what the equity curve does is
        missing the input that matters most.
      </p>

      <h2>Where the numbers actually have to come from</h2>
      <p>
        Whatever fraction of Kelly you decide to run, the win rate and reward-to-risk ratio feeding
        it should come from your own closed trades, not a backtest and not a strategy&apos;s marketing
        claim. <Link href="/features/trading-journal">getALPHA</Link> computes both directly from
        your synced MT5 history, so the inputs are the numbers you actually produced rather than
        the ones you assumed. Even then, treat that output as the upper bound on what to risk, not
        the target — a wide margin between what the formula allows and what you actually size is
        the only real defense against an edge estimate that turns out, a hundred trades from now,
        to have been smaller than it looked.
      </p>
    </BlogPost>
  );
}
