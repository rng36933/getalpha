import type { Candle } from "./display";
import { recallSnapshot, rememberSnapshot } from "./store";
import { describeError, fetchWithTimeout, type SourceResult } from "./types";

/** Bars requested per symbol. Six months of trading days fills the chart. */
const BAR_COUNT = 180;

/**
 * How long a stored series is served before the provider is asked again.
 *
 * Without this, every dashboard load spends one of the eight API credits the
 * free plan allows per minute — so nine page loads in a minute, which is two
 * people using the app, starts returning 429 for everyone including the brief.
 * These are daily bars: the newest one moves intraday, the other 179 are
 * settled history, and nobody reads a six-month daily chart for a price tick.
 */
const FRESH_FOR_MS = 15 * 60 * 1000;

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

function toCandles(series: TwelveDataSeries): Candle[] {
  if (!Array.isArray(series.values)) return [];

  return series.values
    .map((bar): Candle | null => {
      const time = bar.datetime?.slice(0, 10);
      const open = Number(bar.open);
      const high = Number(bar.high);
      const low = Number(bar.low);
      const close = Number(bar.close);

      if (!time || ![open, high, low, close].every(Number.isFinite)) return null;
      return { time, open, high, low, close };
    })
    .filter((c): c is Candle => c !== null)
    // The provider returns newest first; the chart needs ascending time and
    // silently draws nothing when the series is out of order.
    .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Daily bars for one symbol, falling back to the last stored series when the
 * provider is unreachable.
 *
 * One symbol per call, because this runs on a page load rather than in the
 * brief: the free plan allows eight credits a minute and the brief already
 * spends all eight on the watchlist levels. When the two collide the chart is
 * the one that degrades — it has yesterday's bars stored, and the brief does
 * not get a second chance until its cache expires.
 */
export async function fetchDailyCandles(
  symbol: string,
  now: Date = new Date(),
): Promise<SourceResult<Candle[]>> {
  // Served from storage while it is fresh, so page loads do not each cost a
  // credit. This is the cache, not just the outage fallback — the same rows
  // serve both purposes and only the age test differs.
  const stored = await recallSnapshot<Candle[]>("PRICE_SERIES", symbol);

  if (stored && now.getTime() - stored.fetchedAt.getTime() < FRESH_FOR_MS) {
    return {
      data: stored.data,
      status: "LIVE",
      fetchedAt: stored.fetchedAt.toISOString(),
    };
  }

  const key = process.env.TWELVE_DATA_API_KEY;

  if (!key) {
    return fallback(symbol, "TWELVE_DATA_API_KEY is not set");
  }

  const url =
    `https://api.twelvedata.com/time_series` +
    `?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=${BAR_COUNT}` +
    `&apikey=${encodeURIComponent(key)}`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`provider returned ${response.status}`);

    const body = (await response.json()) as TwelveDataSeries;

    // Quota and plan errors arrive as HTTP 200 with a status field.
    if (body.status === "error") {
      throw new Error(body.message ?? "provider error");
    }

    const candles = toCandles(body);
    if (candles.length === 0) {
      throw new Error("provider returned no usable bars");
    }

    await rememberSnapshot("PRICE_SERIES", candles, symbol);

    return { data: candles, status: "LIVE", fetchedAt: now.toISOString() };
  } catch (error) {
    return fallback(symbol, describeError(error));
  }
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
