import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "Correlation Risk: When “Diversified” Trades Are Actually the Same Bet Twice · getALPHA",
  },
  description:
    "Five open positions can still be one bet wearing five tickers. What correlated exposure actually looks like in a trade log, and why the position count on your dashboard is lying to you.",
  alternates: { canonical: "/blog/correlation-risk-same-bet-twice" },
};

export default function Page() {
  return (
    <BlogPost
      title="Correlation Risk: When &ldquo;Diversified&rdquo; Trades Are Actually the Same Bet Twice"
      date="2026-08-26"
    >
      <p>
        Five open positions look like five separate decisions. Long EUR/USD, long GBP/USD, long
        AUD/USD, short USD/JPY, short USD/CHF — different pairs, different charts, different setup
        notes. It reads as diversification. It is often one trade: short the dollar, sized five
        times over, with five separate stop losses that can all get hit inside the same ten-minute
        move.
      </p>

      <h2>Why position count is the wrong number to look at</h2>
      <p>
        &ldquo;How many trades am I in&rdquo; answers a question nobody actually needs answered.
        The number that matters is how many <em>independent</em> bets those trades represent, and
        that number is almost always smaller than the position count. Two positions that move
        together are not two units of risk — they are one unit of risk, taken twice, with two
        commissions and two spreads instead of one.
      </p>
      <p>
        This is easy to miss because correlation doesn&apos;t show up anywhere on a standard
        dashboard. Win rate, average R, and open P&amp;L are all computed per trade. None of them
        ask whether the five trades currently open would all move against you for the same reason
        at the same time.
      </p>

      <h2>Where correlated exposure actually hides</h2>
      <ul>
        <li>
          <strong>Same base or quote currency</strong> — any basket of dollar pairs, whichever
          side you took them on, is exposed to one thing: what the dollar does next. Four dollar
          pairs is not four ideas about the market.
        </li>
        <li>
          <strong>Same macro driver</strong> — a long on gold, a short on the dollar index, and a
          long on the Australian dollar can all be the same &ldquo;risk-off&rdquo; or
          &ldquo;dollar-weak&rdquo; view expressed three ways. They will tend to be right together
          and wrong together.
        </li>
        <li>
          <strong>Same session, same catalyst</strong> — three trades opened in the minutes around
          a single news release aren&apos;t three independent reads of the market, they&apos;re
          one reaction to one event, sized as if it were three separate opinions.
        </li>
        <li>
          <strong>Same instrument class</strong> — index CFDs on the S&amp;P, the Nasdaq, and the
          Dow move together often enough that holding all three isn&apos;t spreading equity risk,
          it&apos;s tripling one view on U.S. stocks.
        </li>
      </ul>
      <p>
        None of these are visible from the position list alone. They only show up when you look at
        what each trade is actually a bet <em>on</em>, not which symbol it happens to be labeled
        with.
      </p>

      <h2>What it does to your real risk per trade</h2>
      <p>
        A 1% risk rule assumes each trade&apos;s stop is an independent event. Stack five
        correlated positions at 1% each and the &ldquo;5% total risk&rdquo; on the sizing
        spreadsheet is a fiction the moment the dollar makes one large move — the five stops don&apos;t
        get hit as five separate 1% events spread over time, they get hit together, and the account
        takes something closer to the full 5% at once. The position sizing was correct on paper and
        wrong in practice, because it priced each trade as if the others didn&apos;t exist.
      </p>
      <p>
        The same math cuts the other way with correlated winners: a run of trades that all worked
        can look like a strategy proving itself across five setups, when it was really one correct
        read on the dollar getting counted five times. That&apos;s a much thinner sample than it
        appears, and it&apos;s worth knowing before the next drawdown, not after it.
      </p>

      <h2>Checking for it without a statistics background</h2>
      <p>
        A full correlation matrix is overkill for most trading journals. A rougher check catches
        most of the real cases: for every open position, write down what it&apos;s a bet on in one
        phrase — &ldquo;dollar weak,&rdquo; &ldquo;risk-off,&rdquo; &ldquo;oil supply,&rdquo;
        &ldquo;tech earnings.&rdquo; Positions that land on the same phrase are the same bet,
        regardless of what symbols they&apos;re wearing. Count the distinct phrases, not the
        distinct tickers — that count is closer to your real number of independent positions.
      </p>
      <p>
        It&apos;s also worth doing after the fact, not just before entry. Pull the trades that lost
        together during your worst week and check whether they shared a driver. If four of your
        five worst days were all dollar moves, the position sizing rule that assumes independence
        is the thing to fix, not the strategy that picked the trades.
      </p>

      <p>
        <Link href="/features/trading-journal">getALPHA</Link> logs every synced trade with its
        instrument and direction, so a stretch of open positions can be checked for overlap instead
        of taken at face value, and{" "}
        <Link href="/features/ai-trade-coach">the AI coach</Link> flags when new entries cluster
        around the same currency or driver as trades already open — the pattern that turns a
        &ldquo;diversified&rdquo; account into one oversized bet without anyone deciding it that
        way.
      </p>
    </BlogPost>
  );
}
