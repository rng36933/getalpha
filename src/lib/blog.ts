/**
 * Metadata for every blog post, newest first.
 *
 * Each post is its own route under `(public)/blog/<slug>`, the same pattern
 * as the legal pages — a real page component per article, not a generic
 * renderer driven by a content blob. This list exists only so the index page
 * and the sitemap have one place to read titles and dates from, without
 * duplicating them a second time inside each post.
 */

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
};

export const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: "backtesting-lies",
    title: "Backtesting Lies: Why Paper Performance Rarely Survives Live Execution",
    description:
      "A backtest that shows a 70% win rate and a smooth equity curve is not lying about the past. It is lying about what happens when you trade it with real money.",
    date: "2026-08-28",
  },
  {
    slug: "average-trade-duration",
    title: "What Your Average Trade Duration Actually Reveals About Your Strategy",
    description:
      "Holding time is one of the least-checked numbers in a trading journal. What it exposes about a strategy that win rate and P&L can't.",
    date: "2026-08-27",
  },
  {
    slug: "correlation-risk-same-bet-twice",
    title: "Correlation Risk: When \"Diversified\" Trades Are Actually the Same Bet Twice",
    description:
      "Five open positions can still be one bet wearing five tickers. What correlated exposure actually looks like in a trade log, and why the position count on your dashboard is lying to you.",
    date: "2026-08-26",
  },
  {
    slug: "losing-streak-vs-broken-strategy",
    title: "The Difference Between a Losing Streak and a Broken Strategy",
    description:
      "Seven losses in a row can mean two very different things: normal variance inside a working edge, or a strategy that stopped working. The numbers that tell the two apart, and the one that usually can't.",
    date: "2026-08-25",
  },
  {
    slug: "drawdown-recovery-math",
    title: "Drawdown Recovery Math: Why a 50% Loss Needs a 100% Gain to Break Even",
    description:
      "The relationship between a loss and the gain needed to undo it isn't 1:1 — it's curved, and it gets steeper the deeper the drawdown goes. What that curve actually looks like, and why it should set your risk limits.",
    date: "2026-08-24",
  },
  {
    slug: "position-sizing-isnt-one-number",
    title: "Position Sizing Isn't One Number: Why the Same 1% Risk Produces Different Trades",
    description:
      "\"Risk 1% per trade\" sounds like a single rule. In practice it produces a different position size, exposure and volatility profile every time, depending on where the stop sits.",
    date: "2026-08-23",
  },
  {
    slug: "cost-of-revenge-trading",
    title: "The Cost of Revenge Trading, In Real Numbers",
    description:
      "Revenge trading doesn't feel like a decision — it feels like getting even. What it actually costs, measured from the trades that follow a loss instead of from the feeling.",
    date: "2026-08-22",
  },
  {
    slug: "trading-the-plan-measured",
    title: "What \"Trading the Plan\" Actually Means, Measured",
    description:
      "\"I traded the plan\" is a self-report, made after the outcome is already known. What the phrase actually breaks down into, and how to check it against the record instead of the memory.",
    date: "2026-08-20",
  },
  {
    slug: "mt5-vs-manual-spreadsheet-journal",
    title: "MT5 vs Manual Spreadsheet Journal: Where the Numbers Diverge",
    description:
      "MT5's own history and a hand-kept spreadsheet rarely agree by the time both are totalled. Where the two numbers actually split, and which one is usually right.",
    date: "2026-08-19",
  },
  {
    slug: "reading-an-equity-curve",
    title: "Reading an Equity Curve: What a Smooth Line Actually Hides",
    description:
      "A rising, smooth equity curve is the image every trader wants to show. It is also one of the easiest charts to be misled by — here is what it does and doesn't tell you.",
    date: "2026-08-18",
  },
  {
    slug: "how-many-trades-before-stats-mean-anything",
    title: "How Many Trades Before Your Statistics Mean Anything",
    description:
      "A win rate or an expectancy number computed from 12 trades is mostly noise. Roughly how much sample size you actually need before it starts describing your edge instead of your luck.",
    date: "2026-08-17",
  },
  {
    slug: "stop-loss-you-set-vs-moved",
    title: "The Stop-Loss You Set vs. The Stop-Loss You Moved",
    description:
      "A stop decided before entry and a stop dragged wider mid-trade look identical in a P&L column. They are not the same decision, and only one of them is risk management.",
    date: "2026-08-16",
  },
  {
    slug: "cut-losses-let-winners-run",
    title: "Why \"Cut Losses, Let Winners Run\" Is Bad Advice Without Data",
    description:
      "The rule tells you which direction to lean, not when to act. Without your own numbers behind it, it produces the opposite of what it promises.",
    date: "2026-08-15",
  },
  {
    slug: "trading-journal-for-prop-firm-challenges",
    title: "Trading Journal for Prop Firm Challenges",
    description:
      "A prop firm challenge doesn't fail you for losing trades. It fails you for breaching a rule you weren't tracking in real time. What to log to see a breach coming.",
    date: "2026-08-14",
  },
  {
    slug: "5-things-a-trading-journal-should-show-you",
    title: "5 Things a Trading Journal Should Show You",
    description:
      "Most journals show you what happened. A useful one shows you what you keep doing — and whether it's working. Five things worth actually looking at.",
    date: "2026-08-13",
  },
  {
    slug: "economic-calendar-without-overtrading",
    title: "How to Use an Economic Calendar Without Overtrading It",
    description:
      "The calendar tells you when volatility is scheduled, not what to do with it. Most of what it causes isn't good trades — it's more trades.",
    date: "2026-08-12",
  },
  {
    slug: "trading-discipline",
    title: "Trading Discipline Is a System, Not a Personality Trait",
    description:
      "Discipline isn't willpower you either have or don't. It's a small set of rules decided in advance, and a way of catching the moment you break one.",
    date: "2026-08-11",
  },
  {
    slug: "what-is-an-ai-trading-coach",
    title: "What Is an AI Trading Coach (And What It Isn't)",
    description:
      "The phrase covers two very different products — one that guesses where price goes next, and one that reads what you already did. Only one of them can actually be checked.",
    date: "2026-08-10",
  },
  {
    slug: "automatic-mt5-journaling",
    title: "Automatic MT5 Journaling: What Gets Recorded and How",
    description:
      "What actually happens when a trading journal syncs itself from MetaTrader 5 — where the numbers come from, what a script can and can't see, and why the stop-loss field is the one that usually breaks first.",
    date: "2026-08-09",
  },
  {
    slug: "r-multiple-vs-pnl",
    title: "R-Multiple vs. P&L: Why One Number Travels and the Other Doesn't",
    description:
      "P&L tells you what a trade was worth in currency. R-multiple tells you what it was worth relative to the risk you took. Only one of those numbers is comparable across trades.",
    date: "2026-08-06",
  },
  {
    slug: "why-win-rate-doesnt-matter",
    title: "Why Your Win Rate Doesn't Matter (And What to Track Instead)",
    description:
      "A high win rate can hide a broken process, and a low one can hide a sound one. What actually separates a good trading decision from a lucky one.",
    date: "2026-08-07",
  },
  {
    slug: "mt5-trading-journal-guide",
    title: "How to Build a Trading Journal for MetaTrader 5",
    description:
      "What a trading journal actually needs to be useful, the manual way to keep one in MT5, and where automatic sync changes the trade-off.",
    date: "2026-08-06",
  },
];
