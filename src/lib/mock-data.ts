export type Candle = {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
};

export type ImpactLevel = "HIGH" | "MEDIUM" | "LOW";

export type EconomicEvent = {
  id: string;
  time: string; // HH:MM, exchange local time
  currency: string;
  title: string;
  impact: ImpactLevel;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
};

/**
 * Seeded PRNG. Math.random() would produce different candles on the server and
 * on the client, which React reports as a hydration mismatch.
 */
function mulberry32(seed: number) {
  let state = seed;

  return function next(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type MockCandleOptions = {
  count?: number;
  startPrice?: number;
  startDate?: string;
  seed?: number;
};

/** Deterministic random-walk OHLC data. Placeholder until a real feed exists. */
export function generateMockCandles({
  count = 180,
  startPrice = 2320,
  startDate = "2026-01-05",
  seed = 20260725,
}: MockCandleOptions = {}): Candle[] {
  const random = mulberry32(seed);
  const candles: Candle[] = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);

  let previousClose = startPrice;

  while (candles.length < count) {
    const weekday = cursor.getUTCDay();

    // Skip weekends so the time axis looks like a real trading calendar.
    if (weekday !== 0 && weekday !== 6) {
      const open = previousClose;

      // Slight upward bias (0.48 rather than 0.5) so the series trends.
      const drift = (random() - 0.48) * 0.011;
      const close = open * (1 + drift);

      const high = Math.max(open, close) * (1 + random() * 0.004);
      const low = Math.min(open, close) * (1 - random() * 0.004);

      candles.push({
        time: cursor.toISOString().slice(0, 10),
        open: round2(open),
        high: round2(high),
        low: round2(low),
        close: round2(close),
      });

      previousClose = close;
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return candles;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Placeholder day of events, standing in for a real calendar feed. */
export const mockEconomicEvents: EconomicEvent[] = [
  {
    id: "eu-flash-pmi",
    time: "10:00",
    currency: "EUR",
    title: "Flash Manufacturing PMI",
    impact: "MEDIUM",
    actual: "47.8",
    forecast: "47.5",
    previous: "47.1",
  },
  {
    id: "uk-gdp",
    time: "11:00",
    currency: "GBP",
    title: "GDP m/m",
    impact: "MEDIUM",
    actual: null,
    forecast: "0.2%",
    previous: "0.1%",
  },
  {
    id: "us-core-cpi",
    time: "15:30",
    currency: "USD",
    title: "Core CPI m/m",
    impact: "HIGH",
    actual: null,
    forecast: "0.3%",
    previous: "0.2%",
  },
  {
    id: "us-jobless-claims",
    time: "15:30",
    currency: "USD",
    title: "Unemployment Claims",
    impact: "MEDIUM",
    actual: null,
    forecast: "218K",
    previous: "223K",
  },
  {
    id: "us-crude-inventories",
    time: "17:30",
    currency: "USD",
    title: "Crude Oil Inventories",
    impact: "LOW",
    actual: null,
    forecast: "-1.4M",
    previous: "2.1M",
  },
  {
    id: "fomc-press",
    time: "21:00",
    currency: "USD",
    title: "FOMC Press Conference",
    impact: "HIGH",
    actual: null,
    forecast: null,
    previous: null,
  },
  {
    id: "nz-trade-balance",
    time: "23:45",
    currency: "NZD",
    title: "Trade Balance",
    impact: "LOW",
    actual: null,
    forecast: "-0.9B",
    previous: "-1.2B",
  },
];
