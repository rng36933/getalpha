/** Currencies the economic calendar publishes releases for. */
export const CALENDAR_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CHF",
  "AUD",
  "NZD",
  "CAD",
] as const;

export type CalendarCurrency = (typeof CALENDAR_CURRENCIES)[number];

const KNOWN = new Set<string>(CALENDAR_CURRENCIES);

/**
 * The currencies a watchlist actually exposes someone to.
 *
 * Both sides of every pair, because a release moves the pair whichever leg it
 * lands on. Metals and cryptoassets contribute only their quote currency:
 * XAU/USD has no calendar of its own, but a US release moves it, and a trader
 * holding gold through an NFP print very much needs to know that.
 */
export function currenciesFromSymbols(symbols: string[]): CalendarCurrency[] {
  const found = new Set<CalendarCurrency>();

  for (const symbol of symbols) {
    const upper = symbol.toUpperCase();

    for (const part of upper.split(/[^A-Z]+/)) {
      if (KNOWN.has(part)) found.add(part as CalendarCurrency);
    }

    // A synced trade's asset carries no separator ("EURUSD", not "EUR/USD"),
    // so the split above never fires for it. A plain six-letter symbol is
    // base and quote concatenated — try both three-letter halves too.
    if (/^[A-Z]{6}$/.test(upper)) {
      const base = upper.slice(0, 3);
      const quote = upper.slice(3);
      if (KNOWN.has(base)) found.add(base as CalendarCurrency);
      if (KNOWN.has(quote)) found.add(quote as CalendarCurrency);
    }
  }

  // Ordered as CALENDAR_CURRENCIES rather than by insertion, so the list reads
  // the same on every visit regardless of watchlist order.
  return CALENDAR_CURRENCIES.filter((currency) => found.has(currency));
}
