import type {
  CalendarInput,
  NewsInput,
  TechnicalLevelsInput,
  TradingSession,
} from "@/lib/ai/types";

/** Where a piece of the snapshot actually came from. */
export type SourceStatus =
  /**
   * Current data. Fetched from the provider on this request, or read from a
   * store inside the freshness window the source deliberately caches for —
   * both are the number the provider would give right now, and `fetchedAt`
   * carries the age either way.
   */
  | "LIVE"
  /** The provider failed; this is an older set, past its freshness window. */
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

/** An instrument the brief can report levels for: provider symbol plus label. */
export type BriefSymbol = { symbol: string; label: string };

/**
 * How many instruments one brief may cover.
 *
 * Capped at eight, and that is a hard provider limit rather than a preference:
 * Twelve Data's free plan allows eight API credits per minute and charges one
 * credit per symbol, batched or not. A ninth instrument makes the whole request
 * fail with 429, taking the other eight down with it.
 *
 * A user's watchlist may hold more than this (`MAX_WATCHLIST_SIZE` is 20), so
 * the set handed to a brief is truncated rather than assumed to fit.
 *
 * The cap is now per *request*, not per app-minute: levels are cached per
 * symbol, so a symbol already fetched inside the freshness window costs no
 * credit at all and is shared by every user watching it.
 */
export const WATCHLIST_LIMIT = 8;

/**
 * What a brief covers when the reader has no watchlist of their own.
 *
 * Gold alone, deliberately. Every Free account resolves to this one set, which
 * means they all share a single cached document whose cost is fixed no matter
 * how many of them there are — the same argument that made the brief shared in
 * the first place. It is also the instrument this desk is actually about.
 */
export const DEFAULT_BRIEF_SYMBOLS: readonly BriefSymbol[] = [
  { symbol: "XAU/USD", label: "XAUUSD" },
] as const;

/*
 * The hardcoded eight-instrument desk list used to live here, and nothing reads
 * it any more: a brief is written from the reader's own instruments, or from
 * `DEFAULT_BRIEF_SYMBOLS` when they have none. It is deleted rather than left
 * exported and unused, because a plausible-looking list of majors sitting in
 * this file is precisely the thing somebody wires back in by accident, and
 * doing so would silently put USDJPY back in a gold trader's brief.
 */

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
