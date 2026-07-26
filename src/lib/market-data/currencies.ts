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
    for (const part of symbol.toUpperCase().split(/[^A-Z]+/)) {
      if (KNOWN.has(part)) found.add(part as CalendarCurrency);
    }
  }

  // Ordered as CALENDAR_CURRENCIES rather than by insertion, so the list reads
  // the same on every visit regardless of watchlist order.
  return CALENDAR_CURRENCIES.filter((currency) => found.has(currency));
}
