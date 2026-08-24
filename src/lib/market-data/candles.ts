import type { Candle } from "./display";
import { recallSnapshot, rememberSnapshot } from "./store";
import { describeError, fetchWithTimeout, type SourceResult } from "./types";

/** Bars requested per series. Enough to give any timeframe a readable shape. */
const BAR_COUNT = 180;

/**
 * The timeframes the chart offers, and how long a stored series is served
 * before the provider is asked again.
 *
 * Caching is not a nicety here. Without it every chart load spends one of the
 * eight API credits the free plan allows per minute, so nine loads a minute —
 * two people using the app — starts returning 429 for everyone, the session
 * brief included.
 *
 * Freshness follows the bar. A daily chart whose newest candle is a quarter of
 * an hour old is telling the truth; a 15-minute chart is not, so it is refetched
 * far sooner. Roughly a fifth of a bar in each case.
 */
export const TIMEFRAMES = {
  // Shortened from 3 minutes on request — safe to do because the cache is
  // one shared row per symbol (see store.ts), not per visitor, so this caps
  // the whole app at one provider call a minute for M15 per symbol in view,
  // nowhere near the 8-credit/minute ceiling for a desk that only tracks
  // XAUUSD in practice.
  M15: { label: "M15", interval: "15min", freshForMs: 60 * 1000 },
  H1: { label: "H1", interval: "1h", freshForMs: 10 * 60 * 1000 },
  H4: { label: "H4", interval: "4h", freshForMs: 30 * 60 * 1000 },
  D1: { label: "D1", interval: "1day", freshForMs: 15 * 60 * 1000 },
  W1: { label: "W1", interval: "1week", freshForMs: 60 * 60 * 1000 },
} as const;

export type Timeframe = keyof typeof TIMEFRAMES;

export const DEFAULT_TIMEFRAME: Timeframe = "D1";

/** Narrows a query-string value, so an unknown timeframe cannot reach the provider. */
export function parseTimeframe(raw: string | undefined): Timeframe {
  return raw && raw in TIMEFRAMES ? (raw as Timeframe) : DEFAULT_TIMEFRAME;
}

type TwelveDataBar = {
  datetime?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
};

type TwelveDataSeries = {
  values?: TwelveDataBar[];
  status?: string;
  message?: string;
};

function toCandles(series: TwelveDataSeries, intraday: boolean): Candle[] {
  if (!Array.isArray(series.values)) return [];

  return series.values
    .map((bar): Candle | null => {
      const open = Number(bar.open);
      const high = Number(bar.high);
      const low = Number(bar.low);
      const close = Number(bar.close);

      const time = barTime(bar.datetime, intraday);

      if (time === null || ![open, high, low, close].every(Number.isFinite)) {
        return null;
      }

      return { time, open, high, low, close };
    })
    .filter((c): c is Candle => c !== null)
    // The provider returns newest first; the chart needs ascending time and
    // silently draws nothing when the series is out of order.
    .sort((a, b) => compareTime(a.time, b.time));
}

/**
 * A date string for daily bars, epoch seconds for intraday ones.
 *
 * The provider is asked for UTC explicitly, so the space-separated timestamp
 * it returns is parsed as UTC rather than as whatever zone the server happens
 * to run in — the same trap the news feeds set.
 */
function barTime(datetime: string | undefined, intraday: boolean): string | number | null {
  if (!datetime) return null;

  if (!intraday) return datetime.slice(0, 10);

  const parsed = Date.parse(`${datetime.replace(" ", "T")}Z`);
  return Number.isNaN(parsed) ? null : Math.floor(parsed / 1000);
}

function compareTime(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

/**
 * Bars for one symbol on one timeframe, falling back to the last stored series
 * when the provider is unreachable.
 *
 * One series per call, because this runs on a page load rather than in the
 * brief: the free plan allows eight credits a minute and the brief already
 * spends all eight on the desk watchlist levels. When the two collide the chart
 * is the one that degrades — it has a stored series, and the brief does not get
 * a second chance until its cache expires.
 */
export async function fetchCandles(
  symbol: string,
  timeframe: Timeframe = DEFAULT_TIMEFRAME,
  now: Date = new Date(),
): Promise<SourceResult<Candle[]>> {
  const { interval, freshForMs } = TIMEFRAMES[timeframe];

  // Stored per symbol *and* timeframe. Sharing one key would serve weekly bars
  // to a request for 15-minute ones, and the chart would look plausible while
  // being entirely wrong.
  const cacheKey = `${symbol}@${timeframe}`;

  // Served from storage while it is fresh, so page loads do not each cost a
  // credit. This is the cache, not just the outage fallback — the same rows
  // serve both purposes and only the age test differs.
  const stored = await recallSnapshot<Candle[]>("PRICE_SERIES", cacheKey);

  if (stored && now.getTime() - stored.fetchedAt.getTime() < freshForMs) {
    return {
      data: stored.data,
      status: "LIVE",
      fetchedAt: stored.fetchedAt.toISOString(),
    };
  }

  const key = process.env.TWELVE_DATA_API_KEY;

  if (!key) {
    return fallback(cacheKey, "TWELVE_DATA_API_KEY is not set");
  }

  const url =
    `https://api.twelvedata.com/time_series` +
    `?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}` +
    `&outputsize=${BAR_COUNT}&timezone=UTC` +
    `&apikey=${encodeURIComponent(key)}`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`provider returned ${response.status}`);

    const body = (await response.json()) as TwelveDataSeries;

    // Quota and plan errors arrive as HTTP 200 with a status field.
    if (body.status === "error") {
      throw new Error(body.message ?? "provider error");
    }

    const candles = toCandles(body, isIntraday(timeframe));
    if (candles.length === 0) {
      throw new Error("provider returned no usable bars");
    }

    await rememberSnapshot("PRICE_SERIES", candles, cacheKey);

    return { data: candles, status: "LIVE", fetchedAt: now.toISOString() };
  } catch (error) {
    return fallback(cacheKey, describeError(error));
  }
}

function isIntraday(timeframe: Timeframe): boolean {
  return timeframe === "M15" || timeframe === "H1" || timeframe === "H4";
}

async function fallback(
  symbol: string,
  reason: string,
): Promise<SourceResult<Candle[]>> {
  const stored = await recallSnapshot<Candle[]>("PRICE_SERIES", symbol);

  if (!stored) {
    return { data: [], status: "UNAVAILABLE", fetchedAt: null, error: reason };
  }

  return {
    data: stored.data,
    status: "CACHED",
    fetchedAt: stored.fetchedAt.toISOString(),
    error: reason,
  };
}
