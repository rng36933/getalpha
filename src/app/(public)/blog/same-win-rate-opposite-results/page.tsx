import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute: "Why Two Traders With the Same Win Rate Can Have Opposite Results · getALPHA",
  },
  description:
    "A 55% win rate can belong to a profitable trader or a slowly-blowing-up one. The number that actually decides which is the one win rate never shows.",
  alternates: { canonical: "/blog/same-win-rate-opposite-results" },
};

export default function Page() {
  return (
    <BlogPost title="Why Two Traders With the Same Win Rate Can Have Opposite Results" date="2026-09-03">
      <p>
        Two traders compare stats. Both are sitting on a 55% win rate over the last hundred trades.
        One of them is up for the quarter. The other is down, and slowly. Same win rate, opposite
        account balance. The number that explains the gap was never in the win rate to begin with —
        win rate only counts how often a trade closes green, and says nothing about how large the
        green trades are relative to the red ones.
      </p>

      <h2>The two numbers win rate is hiding</h2>
      <p>
        A win rate is a single ratio: wins divided by total trades. To know whether that ratio adds
        up to a profitable system, you need two more numbers it doesn&apos;t carry — average win size
        and average loss size, usually expressed in R (multiples of the amount risked on the trade).
        Put together, they give expectancy:
      </p>
      <p>
        <em>Expectancy = (Win% × Avg Win in R) − (Loss% × Avg Loss in R)</em>
      </p>
      <p>
        Win rate is one input to that formula, not the formula. A trader can hold the win rate
        constant and still swing expectancy from comfortably positive to firmly negative just by
        changing the size of the average win relative to the average loss.
      </p>

      <h2>The same 55%, run two ways</h2>
      <p>
        Trader A wins 55% of trades, averaging 1.1R on winners and 1R on losers. Expectancy works out
        to (0.55 × 1.1) − (0.45 × 1.0) = 0.165R per trade — modest, but positive, and it compounds
        over a large enough sample.
      </p>
      <p>
        Trader B also wins 55% of trades. But the winners get taken early, out of a habit of locking
        in profit before it can &ldquo;turn into a loss,&rdquo; averaging 0.5R. The losers, by
        contrast, get held past the original stop on the hope of a bounce, averaging 1.8R. Expectancy:
        (0.55 × 0.5) − (0.45 × 1.8) = −0.535R per trade. Same win rate, and Trader B is paying to
        trade.
      </p>
      <p>
        Nothing about either trader&apos;s win-rate column would flag the difference. It only shows
        up in the size of the wins and losses — a pair of numbers that most journals either don&apos;t
        track or bury below the headline stat.
      </p>

      <h2>Why the losing version of this is so common</h2>
      <p>
        Trader B&apos;s pattern isn&apos;t a rare edge case — it&apos;s the default failure mode for
        anyone optimizing for win rate itself instead of for expectancy. Closing winners early feels
        like discipline, because it locks in a green trade before it can turn red. Letting losers run
        feels like patience, because closing a loser at the stop feels like admitting the trade was
        wrong. Both instincts push in the same direction: they inflate the win-rate number while
        quietly shrinking average win size and inflating average loss size — the two variables that
        actually decide whether the strategy makes money.
      </p>
      <p>
        A trader chasing a higher win rate is, whether they intend it or not, usually chasing a worse
        risk-reward ratio. The two trade off against each other more often than they move together,
        which is exactly why a scoreboard that only shows win rate rewards the wrong behavior.
      </p>

      <h2>What actually separates the two traders</h2>
      <ul>
        <li>
          <strong>Average win size in R, average loss size in R</strong> — computed per trade, not
          eyeballed from memory. This is the pair of numbers win rate can&apos;t substitute for.
        </li>
        <li>
          <strong>Expectancy per trade</strong>, from the formula above, checked on a rolling basis —
          not just once, since it can drift as sizing and stop discipline drift.
        </li>
        <li>
          <strong>How often winners get closed before target</strong>, compared to how often losers
          get held past the stop. A consistent asymmetry here is the mechanism, not a coincidence.
        </li>
        <li>
          <strong>Whether win rate and average R move in opposite directions over time.</strong> A
          rising win rate paired with a shrinking average R is the exact shape of Trader B&apos;s
          problem, and it&apos;s visible months before the account balance confirms it.
        </li>
      </ul>
      <p>
        None of this makes win rate useless — a strategy&apos;s win rate is still a real, meaningful
        property of how it enters trades. It just isn&apos;t the number that tells you whether the
        strategy is worth running, and treating it as if it were is how two traders end up with
        identical stats on one line and opposite outcomes everywhere else.
      </p>

      <h2>Seeing it before the balance does</h2>
      <p>
        Average win and average loss size don&apos;t show up on a broker statement the way win rate
        does, so they&apos;re the numbers that quietly drift while the visible stat looks fine.{" "}
        <Link href="/features/trading-journal">getALPHA</Link> computes R-multiple, average win,
        average loss and expectancy from every closed MT5 trade automatically, so the gap between a
        good win rate and a good strategy shows up in the dashboard instead of in next quarter&apos;s
        balance. From there,{" "}
        <Link href="/features/ai-trade-coach">the AI coach</Link> can flag the asymmetry directly —
        winners closing early, losers running long — while it&apos;s still a pattern in the data and
        not yet a number on the account.
      </p>
    </BlogPost>
  );
}
