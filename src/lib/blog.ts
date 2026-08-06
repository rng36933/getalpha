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
