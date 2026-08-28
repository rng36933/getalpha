import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "Backtesting Lies: Why Paper Performance Rarely Survives Live Execution · getALPHA",
  },
  description:
    "A backtest that shows a 70% win rate and a smooth equity curve is not lying about the past. It is lying about what happens when you trade it with real money.",
  alternates: { canonical: "/blog/backtesting-lies" },
};

export default function Page() {
  return (
    <BlogPost
      title="Backtesting Lies: Why Paper Performance Rarely Survives Live Execution"
      date="2026-08-28"
    >
      <p>
        A backtest that shows a 70% win rate and a smooth equity curve is not lying about the
        past. Run correctly, it is an accurate account of exactly what would have happened if
        those trades had been taken on that data. The lie is in the gap between that account and
        what actually happens when the same rules meet a live market — a gap most traders never
        measure, because the backtest and the live journal are kept in two different places and
        never put side by side.
      </p>

      <h2>Fills are the first thing that changes</h2>
      <p>
        A backtest almost always assumes an order fills at the price the signal fired on. Live,
        it fills at whatever price is available by the time the order reaches the market — after
        the tick that triggered the signal, after the platform processes it, after the broker
        routes it. On a slow-moving pair with tight spreads this difference is small enough to
        ignore. On anything volatile, or during news, or on a strategy that trades near session
        opens, the fill can be several pips away from the modeled price on a meaningful share of
        entries. A strategy with a thin edge on paper can have no edge at all once every entry is
        priced worse than the backtest assumed.
      </p>

      <h2>Spread and commission are usually modeled once, not per trade</h2>
      <p>
        Many backtests apply a fixed, average spread and a flat commission across the whole test.
        Real spread widens around news releases, thins during quiet hours, and varies by broker
        and by symbol. A strategy that concentrates its entries around session opens or news
        events — often the times a backtest looks best, because that is when the moves it is
        designed to catch happen — is also the strategy most exposed to the difference between
        average spread and actual spread at the moment it trades. The backtest charges the average.
        Live, you pay whatever the market is asking right then.
      </p>

      <h2>Backtests don&apos;t hesitate, and you do</h2>
      <p>
        A backtested rule fires the instant its condition is met, every time, without exception.
        A live trader looking at the same setup checks it twice, waits for one more candle to
        confirm, or skips it because the last three signals like it lost. None of that shows up in
        the backtest&apos;s numbers, but all of it shows up in the live results — as entries taken
        later than the rule specified, entries skipped that would have won, and entries taken on
        a whim that the rule never called for in the first place. The strategy being graded and
        the strategy being traded are rarely the exact same thing by the time discretion gets
        involved.
      </p>

      <h2>Overfitting looks like a great backtest and nothing else</h2>
      <p>
        A rule set with enough parameters — a moving average length, an RSI threshold, a specific
        session window, a minimum candle size — can be tuned against historical data until it
        produces an excellent equity curve on that exact data. The tuning is not visible in the
        result; a curve-fit strategy and a genuinely robust one can look identical in a backtest
        report. The tell is usually in how the parameters were chosen: if a setting was picked
        because it happened to maximize the historical result rather than because it reflects
        something true about how the instrument trades, the backtest is measuring how well the
        strategy fits the past, not how well it will handle a future the fitting process never
        saw.
      </p>

      <h2>What actually closes the gap</h2>
      <p>
        Not more backtesting — a live sample checked against the backtest&apos;s assumptions,
        specifically. That means logging, per trade, the price the signal called for against the
        price actually filled, and the spread the backtest assumed against the spread paid. Once
        that comparison exists for a real sample of trades, it tells you exactly which assumption
        is costing you: consistent negative slippage on entries points at execution speed or
        broker routing; a spread gap concentrated around specific hours points at trading through
        conditions the backtest never modeled; a live win rate that tracks the backtest but a live
        expectancy that doesn&apos;t points at fills, not the rules themselves.
      </p>

      <h2>What to actually track</h2>
      <ul>
        <li>
          <strong>Modeled fill vs. actual fill</strong> — the price the signal specified against
          what the order actually executed at, trade by trade.
        </li>
        <li>
          <strong>Assumed spread vs. paid spread</strong> — especially around news windows and
          session opens, where the two diverge the most.
        </li>
        <li>
          <strong>Rule-fired vs. discretion-taken</strong> — which entries and exits followed the
          backtested rule exactly, and which were adjusted in the moment.
        </li>
        <li>
          <strong>Live expectancy vs. backtested expectancy</strong> — on a matched sample size,
          not a handful of trades against years of history.
        </li>
      </ul>
      <p>
        A backtest tells you whether an idea has a plausible edge. Only a live journal, checked
        against that same backtest&apos;s assumptions, tells you whether the edge survived contact
        with real fills and real spread.{" "}
        <Link href="/features/trading-journal">getALPHA</Link>&apos;s journal captures execution
        detail on every synced trade, so that comparison is something you can actually run instead
        of something you assume away.
      </p>
    </BlogPost>
  );
}
