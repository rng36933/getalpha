import type { TechnicalLevelsInput } from "@/lib/ai/types";
import { recallSnapshot, rememberSnapshot } from "./store";
import {
  WATCHLIST,
  describeError,
  fetchWithTimeout,
  type SourceResult,
} from "./types";

type Candle = { high: number; low: number; close: number };

type TwelveDataBar = {
  high?: string;
  low?: string;
  close?: string;
};

type TwelveDataSeries = {
  values?: TwelveDataBar[];
  status?: string;
  message?: string;
};

/**
 * Classic floor-trader pivots from the previous session's range.
 *
 * Computed here rather than asked of the model: these are arithmetic, and a
 * level the model invented would be indistinguishable from a real one in the
 * brief. Same rule as the trade metrics — code calculates, the model judges.
 */
function pivotLevels(previous: Candle): { support: number[]; resistance: number[] } {
  const pivot = (previous.high + previous.low + previous.close) / 3;
  const range = previous.high - previous.low;

  const round = (v: number) => Number(v.toFixed(5));

  return {
    resistance: [2 * pivot - previous.low, pivot + range].map(round),
    support: [2 * pivot - previous.high, pivot - range].map(round),
  };
}

function parseBars(series: TwelveDataSeries): Candle[] {
  if (!Array.isArray(series.values)) return [];

  return series.values
    .map((bar): Candle | null => {
      const high = Number(bar.high);
      const low = Number(bar.low);
      const close = Number(bar.close);

      if (![high, low, close].every(Number.isFinite)) return null;
      return { high, low, close };
    })
    .filter((c): c is Candle => c !== null);
}

function toLevels(
  label: string,
  series: TwelveDataSeries,
): TechnicalLevelsInput | null {
  if (series.status === "error") return null;

  // values[0] is today's forming bar; levels come from the completed one.
  const bars = parseBars(series);
  if (bars.length < 2) return null;

  const [current, previous] = bars;
  const { support, resistance } = pivotLevels(previous);

  return {
    symbol: label,
    timeframe: "D1",
    lastPrice: current.close,
    support,
    resistance,
  };
}

/**
 * Splits the batched response into per-symbol series.
 *
 * Twelve Data returns two different shapes: a bare series for one symbol, and
 * an object keyed by symbol for several. Handling only the second would break
 * the moment the watchlist is trimmed to a single instrument.
 */
function splitResponse(body: unknown): Map<string, TwelveDataSeries> {
  const out = new Map<string, TwelveDataSeries>();
  if (typeof body !== "object" || body === null) return out;

  if ("values" in body || (body as TwelveDataSeries).status === "error") {
    const only = WATCHLIST[0];
    if (only) out.set(only.symbol, body as TwelveDataSeries);
    return out;
  }

  for (const [symbol, series] of Object.entries(body as Record<string, unknown>)) {
    out.set(symbol, series as TwelveDataSeries);
  }
  return out;
}

/**
 * Pivot levels for the whole watchlist in one request, falling back to the last
 * stored set when the provider is unreachable.
 *
 * Batched deliberately: the free plan allows only eight requests per minute, so
 * one request per symbol would cap the watchlist at eight instruments and fail
 * unpredictably at the boundary. Credits are charged per symbol either way.
 */
export async function fetchTechnicalLevels(
  now: Date = new Date(),
): Promise<SourceResult<TechnicalLevelsInput[]>> {
  const key = process.env.TWELVE_DATA_API_KEY;

  if (!key) {
    return fallback("TWELVE_DATA_API_KEY is not set");
  }

  const symbols = WATCHLIST.map((w) => w.symbol).join(",");
  const url =
    `https://api.twelvedata.com/time_series` +
    `?symbol=${encodeURIComponent(symbols)}&interval=1day&outputsize=2` +
    `&apikey=${encodeURIComponent(key)}`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`provider returned ${response.status}`);

    const body: unknown = await response.json();

    // Quota and plan errors arrive as HTTP 200 with a status field.
    if ((body as TwelveDataSeries).status === "error" && !("values" in (body as object))) {
      throw new Error((body as TwelveDataSeries).message ?? "provider error");
    }

    const series = splitResponse(body);
    const levels: TechnicalLevelsInput[] = [];
    const missing: string[] = [];

    for (const entry of WATCHLIST) {
      const parsed = series.get(entry.symbol);
      const result = parsed ? toLevels(entry.label, parsed) : null;

      if (result) levels.push(result);
      else missing.push(`${entry.label}: ${parsed?.message ?? "no data"}`);
    }

    if (levels.length === 0) {
      throw new Error(missing.join("; ") || "no symbols returned data");
    }

    await rememberSnapshot("TECHNICAL_LEVELS", levels);

    return {
      data: levels,
      status: "LIVE",
      fetchedAt: now.toISOString(),
      // A partial result is still live, but name the symbols that are missing.
      error: missing.length > 0 ? missing.join("; ") : undefined,
    };
  } catch (error) {
    return fallback(describeError(error));
  }
}

async function fallback(
  reason: string,
): Promise<SourceResult<TechnicalLevelsInput[]>> {
  const stored = await recallSnapshot<TechnicalLevelsInput[]>("TECHNICAL_LEVELS");

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
