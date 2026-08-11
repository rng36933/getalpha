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
