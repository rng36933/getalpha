import { recallSnapshot, rememberSnapshot } from "./store";
import { describeError, fetchWithTimeout, type SourceResult } from "./types";

/**
 * Macro series from FRED, the St. Louis Fed's public database.
 *
 * Free, no tier, and 120 requests a minute with a key — which is why the whole
 * Macro Desk is built on it rather than on a market data vendor. What it cannot
 * give is anything derived from futures prices: implied policy odds need Fed
 * funds futures, and that is a monthly subscription with an exchange licence
 * on top. Those are absent from this page rather than approximated.
 */

const BASE = "https://api.stlouisfed.org/fred/series/observations";

/**
 * Six hours.
 *
 * Nothing here moves faster than daily, and most of it is monthly. Refetching
 * on every page load would spend the rate limit re-reading a CPI print that
 * changes twelve times a year.
 */
const FRESH_FOR_MS = 6 * 60 * 60 * 1000;

type SeriesSpec = {
  id: string;
  label: string;
  /**
   * `lin` is the published level; `pc1` is percent change from a year ago,
   * computed by FRED. Asking for pc1 means the year-on-year figure is theirs
   * rather than ours — one less arithmetic step to get wrong.
   */
  units: "lin" | "pc1";
  suffix: string;
  decimals: number;
};

export const YIELD_SERIES: SeriesSpec[] = [
  { id: "DGS2", label: "US 2-year", units: "lin", suffix: "%", decimals: 2 },
  { id: "DGS10", label: "US 10-year", units: "lin", suffix: "%", decimals: 2 },
  { id: "T10Y2Y", label: "10y minus 2y", units: "lin", suffix: "%", decimals: 2 },
  {
    id: "DTWEXBGS",
    label: "Dollar index (broad)",
    units: "lin",
    suffix: "",
    decimals: 2,
  },
];

export const INFLATION_SERIES: SeriesSpec[] = [
  { id: "CPIAUCSL", label: "CPI", units: "pc1", suffix: "% y/y", decimals: 1 },
  { id: "CPILFESL", label: "Core CPI", units: "pc1", suffix: "% y/y", decimals: 1 },
  { id: "PCEPI", label: "PCE", units: "pc1", suffix: "% y/y", decimals: 1 },
  { id: "PCEPILFE", label: "Core PCE", units: "pc1", suffix: "% y/y", decimals: 1 },
];

/**
 * Two policy rates and one market rate, and the labels say which is which.
 *
 * Fed funds effective and the ECB deposit facility are set by their central
 * banks. SONIA is not: it is what UK banks actually paid overnight, and it
 * tracks Bank Rate closely without being it. FRED has no current Bank Rate
 * series — the old one was discontinued — so the honest options were to label
 * SONIA accurately or to leave the UK out, and a mislabelled number on a page
 * that sells itself on facts is worse than a missing one.
 */
export const POLICY_SERIES: SeriesSpec[] = [
  { id: "DFF", label: "Fed funds (effective)", units: "lin", suffix: "%", decimals: 2 },
  { id: "ECBDFR", label: "ECB deposit facility", units: "lin", suffix: "%", decimals: 2 },
  { id: "IUDSOIA", label: "SONIA — UK overnight, not Bank Rate", units: "lin", suffix: "%", decimals: 2 },
];

const ALL_SERIES = [...YIELD_SERIES, ...INFLATION_SERIES, ...POLICY_SERIES];

export type MacroReading = {
  id: string;
  label: string;
  /** Formatted for display, e.g. "4.21%" or "2.4% y/y". Null when unavailable. */
  value: string | null;
  /** Change from the previous observation, already formatted. */
  change: string | null;
  /** Sign of the change, for colour. Zero when flat or unknown. */
  direction: -1 | 0 | 1;
  /** The observation date, so a stale print is visible as stale. */
  asOf: string | null;
};

type FredObservation = { date?: string; value?: string };

/**
 * FRED writes "." for a missing observation — a holiday on a daily series, or
 * a month not yet published. Parsed as absent rather than as zero, which would
 * draw a yield collapsing to nothing.
 */
function parseValue(raw: string | undefined): number | null {
  if (!raw || raw === ".") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * How long one FRED series gets.
 *
 * Longer than the shared `PROVIDER_TIMEOUT_MS`, which is 5 seconds because the
 * session brief has a Claude call waiting behind it. The Macro Desk has nothing
 * waiting behind it, and FRED under concurrent load is not quick — every series
 * failing at once in production, while each one answered fine from a laptop, is
 * exactly what too short a deadline looks like.
 */
const SERIES_TIMEOUT_MS = 9_000;

/**
 * Series fetched at a time.
 *
 * Eleven at once is eleven simultaneous connections from one address. On
 * Vercel that address is shared with everybody else on the platform, so it is
 * also the address most likely to be throttled — and a throttle that arrives
 * as eleven silent failures is indistinguishable from an outage.
 */
const BATCH_SIZE = 4;

type SeriesOutcome = { reading: MacroReading; error: string | null };

async function fetchSeries(
  spec: SeriesSpec,
  apiKey: string,
): Promise<SeriesOutcome> {
  const url =
    `${BASE}?series_id=${encodeURIComponent(spec.id)}` +
    `&api_key=${encodeURIComponent(apiKey)}&file_type=json` +
    `&units=${spec.units}&sort_order=desc&limit=8`;

  const blank: MacroReading = {
    id: spec.id,
    label: spec.label,
    value: null,
    change: null,
    direction: 0,
    asOf: null,
  };

  const empty = (error: string): SeriesOutcome => ({
    reading: blank,
    error: `${spec.id}: ${error}`,
  });

  try {
    const response = await fetchWithTimeout(url, SERIES_TIMEOUT_MS);
    // 429 and 403 are the two that matter and they were previously
    // indistinguishable from "no data": one is a rate limit that will pass, the
    // other is a rejected key that never will.
    if (!response.ok) return empty(`HTTP ${response.status}`);

    const body = (await response.json()) as { observations?: FredObservation[] };

    // Newest first, and the first few can be "." — take the newest two that
    // actually have a number rather than assuming index 0 and 1 are usable.
    const usable = (body.observations ?? [])
      .map((observation) => ({
        date: observation.date ?? null,
        value: parseValue(observation.value),
      }))
      .filter((o): o is { date: string | null; value: number } => o.value !== null);

    const [latest, previous] = usable;
    if (!latest) return empty("no usable observation");

    const delta = previous ? latest.value - previous.value : null;

    return {
      reading: {
        id: spec.id,
        label: spec.label,
        value: `${latest.value.toFixed(spec.decimals)}${spec.suffix}`,
        change:
          delta === null
            ? null
            : `${delta > 0 ? "+" : ""}${delta.toFixed(spec.decimals)}`,
        direction: delta === null || delta === 0 ? 0 : delta > 0 ? 1 : -1,
        asOf: latest.date,
      },
      error: null,
    };
  } catch (error) {
    // One failed series must not empty the whole page — but it must be nameable,
    // or a page with nothing on it cannot be told from a provider with nothing
    // to say.
    return empty(describeError(error));
  }
}

/**
 * Every macro reading, cached as one set.
 *
 * Ten series is ten requests, well inside the rate limit, but they are stored
 * together because the page shows them together — a partial cache would leave
 * one card fresh and another six hours old with nothing saying so.
 */
export async function fetchMacroSeries(
  now: Date = new Date(),
): Promise<SourceResult<MacroReading[]>> {
  const stored = await recallSnapshot<MacroReading[]>("MACRO_SERIES", "all");

  if (stored && now.getTime() - stored.fetchedAt.getTime() < FRESH_FOR_MS) {
    return {
      data: stored.data,
      status: "LIVE",
      fetchedAt: stored.fetchedAt.toISOString(),
    };
  }

  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey) {
    return fallback("FRED_API_KEY is not set");
  }

  try {
    const outcomes: SeriesOutcome[] = [];

    // In batches rather than all at once, so a shared egress address does not
    // open eleven connections to FRED in the same instant.
    for (let i = 0; i < ALL_SERIES.length; i += BATCH_SIZE) {
      const batch = ALL_SERIES.slice(i, i + BATCH_SIZE);
      outcomes.push(
        ...(await Promise.all(batch.map((spec) => fetchSeries(spec, apiKey)))),
      );
    }

    const readings = outcomes.map((outcome) => outcome.reading);
    const failures = outcomes
      .map((outcome) => outcome.error)
      .filter((error): error is string => error !== null);

    if (readings.every((reading) => reading.value === null)) {
      // The reasons, not a summary of them. "no series returned a usable
      // observation" was true and told nobody whether the key was rejected, the
      // address throttled, or the deadline simply too short.
      throw new Error(failures.join("; ") || "no series returned a value");
    }

    await rememberSnapshot("MACRO_SERIES", readings, "all");

    return {
      data: readings,
      status: "LIVE",
      fetchedAt: now.toISOString(),
      // A partial result is still live; name the series that are missing.
      error: failures.length > 0 ? failures.join("; ") : undefined,
    };
  } catch (error) {
    return fallback(describeError(error));
  }
}

async function fallback(reason: string): Promise<SourceResult<MacroReading[]>> {
  // Logged, not only returned. `DataQualityNotice` renders one sentence for
  // every kind of failure — "provider unreachable and nothing stored" reads the
  // same whether the key is missing, the address is throttled or the deadline
  // was short. Without this line the only copy of the real reason is a value
  // nothing displays.
  console.error(`FRED macro series unavailable: ${reason}`);

  const stored = await recallSnapshot<MacroReading[]>("MACRO_SERIES", "all");

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

/** Picks the readings for one card out of the full set. */
export function readingsFor(
  all: MacroReading[],
  specs: SeriesSpec[],
): MacroReading[] {
  return specs
    .map((spec) => all.find((reading) => reading.id === spec.id))
    .filter((reading): reading is MacroReading => reading !== undefined);
}
