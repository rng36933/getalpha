import { recallSnapshot, rememberSnapshot } from "./store";
import { describeError, fetchWithTimeout, type SourceResult } from "./types";

/**
 * Weekly futures positioning from the CFTC's own public feed.
 *
 * No key, no quota, no vendor. The report is published Friday afternoon and
 * describes positions as of the previous Tuesday — that lag is the report, not
 * the free tier, and no amount of money removes it. The page says so, because
 * a positioning number read as live is a positioning number read wrong.
 */

const BASE = "https://publicreporting.cftc.gov/resource/6dca-aqww.json";

/** Published weekly, so re-reading it more than a few times a day is waste. */
const FRESH_FOR_MS = 6 * 60 * 60 * 1000;

/**
 * Market names exactly as the CFTC writes them.
 *
 * Verified against a live report rather than guessed: the feed also carries
 * "EURO FX/BRITISH POUND XRATE" and "MICRO GOLD", and a `like '%GOLD%'` match
 * quietly returns the wrong contract.
 */
const MARKETS = [
  { name: "GOLD - COMMODITY EXCHANGE INC.", label: "Gold" },
  { name: "SILVER - COMMODITY EXCHANGE INC.", label: "Silver" },
  { name: "EURO FX - CHICAGO MERCANTILE EXCHANGE", label: "Euro" },
  { name: "BRITISH POUND - CHICAGO MERCANTILE EXCHANGE", label: "Pound" },
  { name: "JAPANESE YEN - CHICAGO MERCANTILE EXCHANGE", label: "Yen" },
  { name: "BITCOIN - CHICAGO MERCANTILE EXCHANGE", label: "Bitcoin" },
] as const;

export type CotRow = {
  label: string;
  /** Long minus short among non-commercial traders — the speculative tilt. */
  net: number;
  long: number;
  short: number;
  /** Net as a share of the two sides combined, -100 to 100. */
  skew: number;
  /** Tuesday the positions were held, not the Friday it was published. */
  asOf: string;
};

type RawRow = {
  market_and_exchange_names?: string;
  report_date_as_yyyy_mm_dd?: string;
  noncomm_positions_long_all?: string;
  noncomm_positions_short_all?: string;
};

function toNumber(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchCotPositioning(
  now: Date = new Date(),
): Promise<SourceResult<CotRow[]>> {
  const stored = await recallSnapshot<CotRow[]>("COT_POSITIONING", "latest");

  if (stored && now.getTime() - stored.fetchedAt.getTime() < FRESH_FOR_MS) {
    return {
      data: stored.data,
      status: "LIVE",
      fetchedAt: stored.fetchedAt.toISOString(),
    };
  }

  const names = MARKETS.map((market) => `'${market.name.replace(/'/g, "''")}'`);

  const url =
    `${BASE}?$select=market_and_exchange_names,report_date_as_yyyy_mm_dd,` +
    `noncomm_positions_long_all,noncomm_positions_short_all` +
    `&$where=${encodeURIComponent(`market_and_exchange_names in(${names.join(",")})`)}` +
    `&$order=${encodeURIComponent("report_date_as_yyyy_mm_dd DESC")}` +
    // Several weeks back, so the newest row per market is present even when a
    // contract is missing from the latest report.
    `&$limit=60`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`feed returned ${response.status}`);

    const body = (await response.json()) as RawRow[];
    if (!Array.isArray(body)) throw new Error("feed returned an unexpected shape");

    const rows: CotRow[] = [];

    for (const market of MARKETS) {
      // Ordered newest first, so the first match is the latest report that
      // actually contains this contract.
      const raw = body.find(
        (row) => row.market_and_exchange_names === market.name,
      );

      const long = toNumber(raw?.noncomm_positions_long_all);
      const short = toNumber(raw?.noncomm_positions_short_all);
      const asOf = raw?.report_date_as_yyyy_mm_dd?.slice(0, 10);

      if (long === null || short === null || !asOf) continue;

      const total = long + short;

      rows.push({
        label: market.label,
        long,
        short,
        net: long - short,
        skew: total > 0 ? Math.round(((long - short) / total) * 100) : 0,
        asOf,
      });
    }

    if (rows.length === 0) throw new Error("no markets returned data");

    await rememberSnapshot("COT_POSITIONING", rows, "latest");

    return { data: rows, status: "LIVE", fetchedAt: now.toISOString() };
  } catch (error) {
    const reason = describeError(error);

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
}
