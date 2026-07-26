/**
 * Which headlines are about a given instrument.
 *
 * A relevance filter, not a sentiment reading. It decides whether a headline
 * mentions gold or the dollar; it does not decide whether the headline is good
 * news for either. Scoring words as bullish or bearish looks precise and is
 * not — "gold slips as dollar firms" and "dollar firms, gold slips" would score
 * differently on any keyword tally, and the reader can judge the sentence
 * faster than a word list can pretend to.
 */

/** What each leg of a symbol is called in a headline. */
const TERMS: Record<string, string[]> = {
  XAU: ["gold", "xau", "bullion"],
  XAG: ["silver", "xag"],
  USD: ["dollar", "usd", "greenback", "fed", "fomc", "powell"],
  EUR: ["euro", "eur", "ecb", "lagarde", "eurozone"],
  GBP: ["pound", "sterling", "gbp", "boe", "bailey"],
  JPY: ["yen", "jpy", "boj", "japan"],
  CHF: ["franc", "chf", "snb"],
  AUD: ["aussie", "australian dollar", "aud", "rba"],
  NZD: ["kiwi", "new zealand dollar", "nzd", "rbnz"],
  CAD: ["loonie", "canadian dollar", "cad", "boc"],
  BTC: ["bitcoin", "btc"],
  ETH: ["ethereum", "eth", "ether"],
};

/**
 * The words worth looking for, given a symbol like "XAU/USD".
 *
 * The whole pair spelled out too, so "XAU/USD hits a record" matches even
 * though no leg is named in words.
 */
export function termsFor(symbol: string): string[] {
  const upper = symbol.toUpperCase();
  const legs = upper.split(/[^A-Z]+/).filter((leg) => leg.length > 0);

  const terms = new Set<string>();

  // "XAU/USD" and "XAUUSD" both, because feeds write it either way.
  terms.add(upper.toLowerCase());
  terms.add(legs.join("").toLowerCase());

  for (const leg of legs) {
    for (const term of TERMS[leg] ?? [leg.toLowerCase()]) {
      terms.add(term);
    }
  }

  return [...terms];
}

/**
 * True when the text names one of the terms.
 *
 * Matched on word boundaries, so "eth" does not fire on "whether" and "boe"
 * does not fire on "boeing" — the kind of false positive that makes a filtered
 * list less trustworthy than an unfiltered one.
 */
export function mentions(text: string, terms: string[]): boolean {
  const haystack = text.toLowerCase();

  return terms.some((term) => {
    const index = haystack.indexOf(term);
    if (index === -1) return false;

    const before = haystack[index - 1];
    const after = haystack[index + term.length];
    const isWordChar = (char: string | undefined) =>
      char !== undefined && /[a-z0-9]/.test(char);

    return !isWordChar(before) && !isWordChar(after);
  });
}

/**
 * Headlines about this instrument, newest first, capped.
 *
 * Returns an empty list rather than falling back to everything: a caller that
 * wants "no news about gold today" to be sayable needs to be able to tell that
 * apart from "here is some unrelated news".
 */
export function headlinesFor<T extends { title: string; publishedAt: string }>(
  headlines: T[],
  symbol: string,
  limit = 5,
): T[] {
  const terms = termsFor(symbol);

  return headlines
    .filter((headline) => mentions(headline.title, terms))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}
