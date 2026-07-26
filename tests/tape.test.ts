import assert from "node:assert/strict";
import test from "node:test";
import { computeDayTape } from "../src/lib/market-data/tape.ts";

type Bar = {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
};

/** Ten quiet 20-point sessions, so the average daily range is 20. */
function goldHistory(): Bar[] {
  return Array.from({ length: 10 }, (_, i) => ({
    time: `2026-07-${String(i + 1).padStart(2, "0")}`,
    open: 2300,
    high: 2310,
    low: 2290,
    close: 2300,
  }));
}

function m15(closes: number[], bullish = true): Bar[] {
  return closes.map((close, i) => ({
    time: 1_780_000_000 + i * 900,
    open: bullish ? close - 1 : close + 1,
    high: close + 2,
    low: close - 2,
    close,
  }));
}

const readingOf = (tape: ReturnType<typeof computeDayTape>, key: string) =>
  tape?.readings.find((r) => r.key === key);

test("a session that opened low and closed at its high reads up", () => {
  const tape = computeDayTape({
    symbol: "XAU/USD",
    label: "XAUUSD",
    daily: [
      ...goldHistory(),
      { time: "2026-07-11", open: 2300, high: 2340, low: 2298, close: 2338 },
    ],
    intraday: m15([2320, 2325, 2330, 2334, 2336, 2338]),
  });

  assert.ok(tape);
  assert.equal(tape.direction, "UP");
  assert.equal(tape.changeAbsolute, 38);
  assert.equal(tape.changePercent, 1.65);
  assert.equal(readingOf(tape, "VS_OPEN")?.direction, "UP");
  assert.equal(readingOf(tape, "RANGE_POSITION")?.direction, "UP");
  assert.equal(readingOf(tape, "INTRADAY_BARS")?.direction, "UP");
});

test("a session that gave everything back reads down", () => {
  const tape = computeDayTape({
    symbol: "XAU/USD",
    label: "XAUUSD",
    daily: [
      ...goldHistory(),
      { time: "2026-07-11", open: 2300, high: 2342, low: 2258, close: 2262 },
    ],
    intraday: m15([2290, 2285, 2278, 2270, 2266, 2262], false),
  });

  assert.ok(tape);
  assert.equal(tape.direction, "DOWN");
  assert.equal(readingOf(tape, "VS_OPEN")?.direction, "DOWN");
  assert.equal(readingOf(tape, "RANGE_POSITION")?.direction, "DOWN");
  assert.equal(readingOf(tape, "INTRADAY_BARS")?.direction, "DOWN");
});

test("a move smaller than a tenth of the usual range is flat, not a direction", () => {
  // Average daily range is 20, so the dead zone is 2. A 1.5-point day is noise.
  const tape = computeDayTape({
    symbol: "XAU/USD",
    label: "XAUUSD",
    daily: [
      ...goldHistory(),
      { time: "2026-07-11", open: 2300, high: 2306, low: 2297, close: 2301.5 },
    ],
    intraday: m15([2301, 2301.2, 2301.5, 2301.3, 2301.5, 2301.5]),
  });

  assert.ok(tape);
  assert.equal(tape.direction, "FLAT");
  assert.equal(readingOf(tape, "VS_OPEN")?.direction, "FLAT");
});

test("the dead zone scales with the instrument, not with a fixed percentage", () => {
  // EUR/USD moving 0.0015 is the same kind of nothing as gold moving 1.5, and
  // has to be read the same way. Average range here is 0.0080, dead zone 0.0008.
  const history: Bar[] = Array.from({ length: 10 }, (_, i) => ({
    time: `2026-07-${String(i + 1).padStart(2, "0")}`,
    open: 1.085,
    high: 1.089,
    low: 1.081,
    close: 1.085,
  }));

  const flat = computeDayTape({
    symbol: "EUR/USD",
    label: "EURUSD",
    daily: [
      ...history,
      { time: "2026-07-11", open: 1.085, high: 1.0862, low: 1.0845, close: 1.0855 },
    ],
    intraday: m15([1.0852, 1.0853, 1.0855, 1.0854, 1.0855]),
  });

  const moved = computeDayTape({
    symbol: "EUR/USD",
    label: "EURUSD",
    daily: [
      ...history,
      { time: "2026-07-11", open: 1.085, high: 1.0925, low: 1.0848, close: 1.092 },
    ],
    intraday: m15([1.088, 1.089, 1.0905, 1.091, 1.092]),
  });

  assert.equal(flat?.direction, "FLAT");
  assert.equal(moved?.direction, "UP");
});

test("an even split of bars is reported as a split", () => {
  const tape = computeDayTape({
    symbol: "XAU/USD",
    label: "XAUUSD",
    daily: [
      ...goldHistory(),
      { time: "2026-07-11", open: 2300, high: 2320, low: 2290, close: 2310 },
    ],
    intraday: [
      { time: 1, open: 2300, high: 2305, low: 2299, close: 2304 },
      { time: 2, open: 2304, high: 2306, low: 2300, close: 2301 },
      { time: 3, open: 2301, high: 2308, low: 2300, close: 2307 },
      { time: 4, open: 2307, high: 2309, low: 2302, close: 2303 },
    ],
  });

  const bars = readingOf(tape, "INTRADAY_BARS");
  assert.equal(bars?.direction, "FLAT");
  assert.equal(bars?.value, "2 up / 2 down");
});

test("range position is measured from the low", () => {
  const tape = computeDayTape({
    symbol: "XAU/USD",
    label: "XAUUSD",
    daily: [
      ...goldHistory(),
      { time: "2026-07-11", open: 2300, high: 2320, low: 2300, close: 2310 },
    ],
    intraday: m15([2305, 2308, 2310]),
  });

  assert.equal(tape?.rangePosition, 50);
  assert.equal(readingOf(tape, "RANGE_POSITION")?.direction, "FLAT");
});

test("a closed market is named rather than reported as a flat day", () => {
  // Gold on a Sunday: the daily bar exists and has traded a quarter of a point
  // against a twenty-point average. Correct arithmetic, no information.
  const tape = computeDayTape({
    symbol: "XAU/USD",
    label: "XAUUSD",
    daily: [
      ...goldHistory(),
      { time: "2026-07-12", open: 2300.05, high: 2300.2, low: 2299.95, close: 2300 },
    ],
    intraday: m15([2300, 2300.05, 2300, 2300.02]),
  });

  assert.ok(tape);
  assert.equal(tape.barelyTraded, true);
  assert.equal(tape.direction, "FLAT");
  // Two decimals rounded this to a flat zero, which reads as a broken feed.
  assert.ok(tape.rangeVsAverage !== null && tape.rangeVsAverage > 0);
});

test("a normal session is not flagged as untraded", () => {
  const tape = computeDayTape({
    symbol: "XAU/USD",
    label: "XAUUSD",
    daily: [
      ...goldHistory(),
      { time: "2026-07-11", open: 2300, high: 2318, low: 2296, close: 2314 },
    ],
    intraday: m15([2305, 2309, 2314]),
  });

  assert.equal(tape?.barelyTraded, false);
});

test("a wider day than usual is reported as a multiple", () => {
  const tape = computeDayTape({
    symbol: "XAU/USD",
    label: "XAUUSD",
    daily: [
      ...goldHistory(),
      { time: "2026-07-11", open: 2300, high: 2360, low: 2300, close: 2350 },
    ],
    intraday: m15([2340, 2345, 2350]),
  });

  // A 60-point range against a 20-point average.
  assert.equal(tape?.rangeVsAverage, 3);
});

test("prices are formatted for the instrument, not for gold", () => {
  const euro = computeDayTape({
    symbol: "EUR/USD",
    label: "EURUSD",
    daily: [
      {
        time: "2026-07-10",
        open: 1.085,
        high: 1.089,
        low: 1.081,
        close: 1.0854,
      },
      { time: "2026-07-11", open: 1.0854, high: 1.0925, low: 1.085, close: 1.092 },
    ],
    intraday: m15([1.089, 1.0905, 1.092]),
  });

  assert.ok(euro?.readings[0].detail.includes("1.08540"));
});

test("one bar is not enough to draw an arrow from", () => {
  assert.equal(
    computeDayTape({
      symbol: "XAU/USD",
      label: "XAUUSD",
      daily: [{ time: "2026-07-11", open: 2300, high: 2310, low: 2290, close: 2305 }],
      intraday: [],
    }),
    null,
  );

  assert.equal(
    computeDayTape({ symbol: "XAU/USD", label: "XAUUSD", daily: [], intraday: [] }),
    null,
  );
});

test("no intraday series still yields the daily readings", () => {
  const tape = computeDayTape({
    symbol: "XAU/USD",
    label: "XAUUSD",
    daily: [
      ...goldHistory(),
      { time: "2026-07-11", open: 2300, high: 2340, low: 2298, close: 2338 },
    ],
    intraday: [],
  });

  assert.ok(tape);
  assert.equal(tape.intradayBars, 0);
  assert.equal(readingOf(tape, "INTRADAY_BARS"), undefined);
  assert.equal(readingOf(tape, "VS_OPEN")?.direction, "UP");
  assert.equal(tape.sessionDate, "2026-07-11");
});

test("the readings that agree are counted, not blended into a score", () => {
  const tape = computeDayTape({
    symbol: "XAU/USD",
    label: "XAUUSD",
    daily: [
      ...goldHistory(),
      { time: "2026-07-11", open: 2300, high: 2340, low: 2298, close: 2338 },
    ],
    intraday: m15([2320, 2325, 2330, 2334, 2336, 2338]),
  });

  assert.ok(tape);
  const { up, down, flat } = tape.agreeing;
  assert.equal(up + down + flat, tape.readings.length);
  assert.equal(down, 0);
});
