import { createHash } from "node:crypto";
import { DEFAULT_BRIEF_SYMBOLS, type BriefSymbol } from "./types.ts";

/**
 * The pure half of deciding what a brief covers.
 *
 * Split from `brief-audience.ts`, which needs Prisma and Clerk, for the same
 * reason `billing/mode.ts` was split out of `stripe.ts`: `npm test` runs the
 * bare node runner, which resolves neither the `@/` alias nor a missing file
 * extension, so anything a test needs to load must import relatively and with
 * `.ts`. The cache key is exactly the kind of thing worth a test — a change in
 * how it is derived silently orphans every stored brief.
 */

export type BriefAudience = {
  /** The instruments this brief reports on, already capped and ordered. */
  symbols: BriefSymbol[];
  /** Cache identity for that set. Two readers sharing it share the document. */
  key: string;
  /** Whether the reader is getting their own instruments or the free default. */
  personalised: boolean;
  /**
   * True when the watchlist held more instruments than one brief may cover.
   *
   * Carried so the panel can say so. A watchlist of twelve producing a brief
   * about eight, under a label reading "covers your watchlist", is the exact
   * shape of copy that quietly stops being true — and the reader would have no
   * way to tell which four were dropped.
   */
  truncated: boolean;
};

/**
 * Cache identity for a set of instruments.
 *
 * Sorted before hashing, so a watchlist reordered in the UI is still the same
 * brief — the order instruments appear in a sidebar is not a fact about the
 * market, and treating it as one would pay for a second identical call every
 * time somebody dragged a row. Deduplicated for the same reason.
 *
 * Hashed rather than joined because the value is a database key, and a joined
 * list of twenty symbols is neither bounded nor pleasant to read in a query.
 * Truncated to 16 hex characters: collisions there need billions of distinct
 * watchlists to become likely, and the population is bounded by the number of
 * paying users.
 */
export function watchlistKey(symbols: readonly BriefSymbol[]): string {
  const canonical = [...new Set(symbols.map((entry) => entry.symbol))]
    .sort()
    .join(",");

  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}

/** The free default: gold alone, shared by everyone who has not paid. */
export function defaultAudience(): BriefAudience {
  const symbols = [...DEFAULT_BRIEF_SYMBOLS];

  return {
    symbols,
    key: watchlistKey(symbols),
    personalised: false,
    truncated: false,
  };
}
