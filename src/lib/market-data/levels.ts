import type { TechnicalLevelsInput } from "@/lib/ai/types";
import {
  pruneSnapshotsByKind,
  recallNewestByKey,
  rememberSnapshot,
} from "./store";
import {
  WATCHLIST_LIMIT,
  describeError,
  fetchWithTimeout,
  type BriefSymbol,
  type SourceResult,
} from "./types";

/**
 * How old a stored level set may be before that symbol is fetched again.
 *
 * Only `lastPrice` ages. Support and resistance are pivots off the *previous*
 * completed daily bar, so they are the same numbers all day — fetching them
 * again buys nothing. Fifteen minutes matches the freshness the D1 chart
 * series already uses, kept identical so two panels on one screen cannot
 * disagree about what "now" means.
 *
 * This constant is what makes per-user briefs affordable. A symbol fetched for
 * one reader answers every other reader watching it for the next quarter hour,
 * so provider cost scales with the number of *distinct instruments the whole
 * app watches*, not with the number of users.
 */
export const LEVELS_TTL_MS = 15 * 60 * 1000;

/**
 * How old a stored set may be before it is worthless even as a fallback.
 *
 * Yesterday's pivots described yesterday's range. Serving them under a "last
 * good data from…" label would be honest about the age and still wrong about
 * the market, so past this point the symbol is reported missing instead.
 */
const MAX_STALE_LEVELS_MS = 24 * 60 * 60 * 1000;

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
function splitResponse(
  body: unknown,
  requested: readonly BriefSymbol[],
): Map<string, TwelveDataSeries> {
  const out = new Map<string, TwelveDataSeries>();
  if (typeof body !== "object" || body === null) return out;

  if ("values" in body || (body as TwelveDataSeries).status === "error") {
    const only = requested[0];
    if (only) out.set(only.symbol, body as TwelveDataSeries);
    return out;
  }

  for (const [symbol, series] of Object.entries(body as Record<string, unknown>)) {
    out.set(symbol, series as TwelveDataSeries);
  }
  return out;
}

/** One provider call for the symbols that are not already cached and fresh. */
async function fetchFromProvider(
  wanted: readonly BriefSymbol[],
): Promise<{ levels: Map<string, TechnicalLevelsInput>; missing: string[] }> {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) throw new Error("TWELVE_DATA_API_KEY is not set");

  const symbols = wanted.map((w) => w.symbol).join(",");
  const url =
    `https://api.twelvedata.com/time_series` +
    `?symbol=${encodeURIComponent(symbols)}&interval=1day&outputsize=2` +
    `&apikey=${encodeURIComponent(key)}`;

  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`provider returned ${response.status}`);

  const body: unknown = await response.json();

  // Quota and plan errors arrive as HTTP 200 with a status field.
  if ((body as TwelveDataSeries).status === "error" && !("values" in (body as object))) {
    throw new Error((body as TwelveDataSeries).message ?? "provider error");
  }

  const series = splitResponse(body, wanted);
  const levels = new Map<string, TechnicalLevelsInput>();
  const missing: string[] = [];

  for (const entry of wanted) {
    const parsed = series.get(entry.symbol);
    const result = parsed ? toLevels(entry.label, parsed) : null;

    if (result) levels.set(entry.symbol, result);
    else missing.push(`${entry.label}: ${parsed?.message ?? "no data"}`);
  }

  if (levels.size === 0) {
    throw new Error(missing.join("; ") || "no symbols returned data");
  }

  return { levels, missing };
}

/**
 * Pivot levels for a given set of instruments.
 *
 * Cached per symbol rather than as one all-or-nothing set, and that is the
 * change that lets every reader have their own instruments. Two consequences,
 * both deliberate:
 *
 * - **A symbol is fetched once for everybody.** Twelve Data's free plan gives
 *   eight credits per minute to the whole app and charges one per symbol, so
 *   before this, one eight-instrument brief spent the entire quota and a second
 *   reader in the same minute got a 429 that took all eight symbols down with
 *   it. Now the credit is spent on cache misses only.
 * - **A partial provider failure costs only the symbols that failed.** The old
 *   shape stored one array under one key, so a single bad symbol either
 *   poisoned the set or was silently dropped from it.
 *
 * The batch is capped at `WATCHLIST_LIMIT` because a ninth symbol in one
 * request fails the whole request, not just the ninth.
 */
export async function fetchTechnicalLevels(
  requested: readonly BriefSymbol[],
  now: Date = new Date(),
): Promise<SourceResult<TechnicalLevelsInput[]>> {
  const wanted = requested.slice(0, WATCHLIST_LIMIT);

  if (wanted.length === 0) {
    return {
      data: [],
      status: "UNAVAILABLE",
      fetchedAt: null,
      error: "no instruments requested",
    };
  }

  const stored = await recallNewestByKey<TechnicalLevelsInput>(
    "TECHNICAL_LEVELS",
    wanted.map((entry) => entry.symbol),
    MAX_STALE_LEVELS_MS,
  );

  const stale: BriefSymbol[] = [];
  const collected = new Map<string, { data: TechnicalLevelsInput; at: Date }>();

  for (const entry of wanted) {
    const row = stored.get(entry.symbol);

    if (row && now.getTime() - row.fetchedAt.getTime() < LEVELS_TTL_MS) {
      collected.set(entry.symbol, { data: row.data, at: row.fetchedAt });
    } else {
      stale.push(entry);
    }
  }

  let problem: string | undefined;

  if (stale.length > 0) {
    try {
      const { levels, missing } = await fetchFromProvider(stale);

      await Promise.all(
        [...levels].map(([symbol, data]) =>
          rememberSnapshot("TECHNICAL_LEVELS", data, symbol),
        ),
      );
      // Every fetch appends a row, so without this the table grows by one row
      // per symbol per quarter hour forever. Awaited rather than fired and
      // forgotten: a serverless invocation can be frozen the moment it returns.
      await pruneSnapshotsByKind("TECHNICAL_LEVELS");

      for (const [symbol, data] of levels) collected.set(symbol, { data, at: now });
      if (missing.length > 0) problem = missing.join("; ");
    } catch (error) {
      problem = describeError(error);

      // The fetch failed, so anything already stored for these symbols is now
      // the best available answer even though it aged out of the window.
      for (const entry of stale) {
        const row = stored.get(entry.symbol);
        if (row) collected.set(entry.symbol, { data: row.data, at: row.fetchedAt });
      }
    }
  }

  // Returned in the order asked for. The reader's first instrument should be
  // the model's first instrument.
  const data = wanted
    .map((entry) => collected.get(entry.symbol)?.data)
    .filter((level): level is TechnicalLevelsInput => level !== undefined);

  if (data.length === 0) {
    return {
      data: [],
      status: "UNAVAILABLE",
      fetchedAt: null,
      error: problem ?? "no levels available",
    };
  }

  // The oldest contributing row, not the newest: "as of" must not claim more
  // freshness than the weakest number in the set actually has.
  const oldest = [...collected.values()].reduce(
    (worst, entry) => (entry.at < worst ? entry.at : worst),
    now,
  );

  return {
    data,
    // Anything inside the freshness window is current data, not a fallback.
    // CACHED is reserved for having served something the window had expired on,
    // because that is what the model is told to treat as unreliable.
    status: now.getTime() - oldest.getTime() < LEVELS_TTL_MS ? "LIVE" : "CACHED",
    fetchedAt: oldest.toISOString(),
    error: problem,
  };
}

