import type {
  CalendarInput,
  NewsInput,
  TechnicalLevelsInput,
  TradingSession,
} from "@/lib/ai/types";

/** Where a piece of the snapshot actually came from. */
export type SourceStatus =
  /** Fetched from the provider just now. */
  | "LIVE"
  /** The provider failed; this is the last set we stored. */
  | "CACHED"
  /** The provider failed and we have nothing stored. */
  | "UNAVAILABLE";

export type SourceResult<T> = {
  data: T;
  status: SourceStatus;
  /** When the data was produced, not when it was read. Null when UNAVAILABLE. */
  fetchedAt: string | null;
  /** Why the live fetch failed. Surfaced to operators, not to the model. */
  error?: string;
};

export type MarketSnapshot = {
  session: TradingSession;
  asOf: string;
  economicEvents: SourceResult<CalendarInput[]>;
  technicalLevels: SourceResult<TechnicalLevelsInput[]>;
  newsHeadlines: SourceResult<NewsInput[]>;
  /** True when any source is not LIVE. Drives the UI warning. */
  degraded: boolean;
};

/**
 * Instruments the brief reports levels for.
 *
 * Capped at eight, and that is a hard provider limit rather than a preference:
 * Twelve Data's free plan allows eight API credits per minute and charges one
 * credit per symbol, batched or not. A ninth instrument makes the whole request
 * fail with 429, taking the other eight down with it.
 *
 * Lifting the cap means either a paid plan, or moving collection out of the
 * request path into a scheduled job that can spread symbols across minutes.
 */
export const WATCHLIST_LIMIT = 8;

export const WATCHLIST = [
  // Metals
  { symbol: "XAU/USD", label: "XAUUSD" },
  // Forex majors
  { symbol: "EUR/USD", label: "EURUSD" },
  { symbol: "GBP/USD", label: "GBPUSD" },
  { symbol: "USD/JPY", label: "USDJPY" },
  { symbol: "AUD/USD", label: "AUDUSD" },
  { symbol: "USD/CHF", label: "USDCHF" },
  // Crypto
  { symbol: "BTC/USD", label: "BTCUSD" },
  { symbol: "ETH/USD", label: "ETHUSD" },
] as const;

/**
 * How long a provider gets before we fall back.
 *
 * Vercel functions have a hard ceiling and the Claude call after this needs
 * most of it, so a slow provider must lose quickly rather than eat the budget.
 */
export const PROVIDER_TIMEOUT_MS = 5_000;

/** Fetch with a hard deadline, so a hanging provider cannot stall the request. */
export async function fetchWithTimeout(
  url: string,
  timeoutMs: number = PROVIDER_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      // These are upstream market feeds; Next's fetch cache must not serve a
      // stale body and make the snapshot silently wrong.
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

export function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.name === "AbortError"
      ? `timed out after ${PROVIDER_TIMEOUT_MS}ms`
      : error.message;
  }
  return String(error);
}
