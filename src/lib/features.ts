/**
 * Metadata for every feature page, matching `blog.ts`'s pattern.
 *
 * One place the features index and the sitemap both read titles and
 * descriptions from, so the two can't drift apart the way blog posts
 * couldn't before this existed.
 */

export type FeaturePageMeta = {
  slug: string;
  title: string;
  description: string;
};

export const FEATURE_PAGES: FeaturePageMeta[] = [
  {
    slug: "trading-journal",
    title: "Automated Trading Journal",
    description:
      "Trades sync straight from MetaTrader 5. P&L, risk taken and reward planned are computed from the terminal — you never type a number in.",
  },
  {
    slug: "ai-trade-coach",
    title: "AI Trading Coach",
    description:
      "A written review of how you traded, judged across five dimensions against your own history. Findings, not platitudes.",
  },
  {
    slug: "session-brief",
    title: "AI Session Brief",
    description:
      "The session, before it starts: tone, the one driver that matters, and where volatility is likely — each claim sourced to a calendar entry.",
  },
];
