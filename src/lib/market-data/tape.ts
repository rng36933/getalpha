import type { Candle } from "./display";
import { tapeCopy } from "./tape-copy.ts";
import type { Locale } from "../i18n/locales.ts";

/**
 * What the day's tape has done, measured — never what it will do next.
 *
 * Every reading here is arithmetic on completed bars: where price sits against
 * the open, against yesterday's close, inside today's range, and against its
 * own recent average. A green arrow means a number went up. It is not a view,
 * a signal, or a suggestion to buy, and nothing in this file may ever become
 * one — the product's whole argument is that it reports facts about the past
 * rather than guesses about the future.
 *
 * The same division as everywhere else: code computes, nobody else gets to.
 */

export type Direction = "UP" | "DOWN" | "FLAT";

export type Reading = {
  key: string;
  label: string;
  direction: Direction;
  /** The measured figure, formatted for display. */
  value: string;
  /** What was measured, in words, so the arrow is never the only explanation. */
  detail: string;
};

export type DayTape = {
  symbol: string;
  label: string;

  lastPrice: number;
  /** Change against the session's own open. */
  changeAbsolute: number;
  changePercent: number;
  /** The headline arrow: price against the open of the session being described. */
  direction: Direction;

  dayOpen: number;
  dayHigh: number;
  dayLow: number;
  /** Where price sits in the day's range, 0 at the low and 100 at the high. */
  rangePosition: number | null;

  readings: Reading[];
  agreeing: { up: number; down: number; flat: number };

  /** Today's range against the average of the last completed sessions. */
  rangeVsAverage: number | null;
  /**
   * True when the session has hardly moved at all against its own history.
   *
   * Almost always a closed market — a weekend, or the hours before an open —
   * where the day's bar exists but has barely traded. The arrows are still
   * arithmetically correct and still nearly meaningless, so the reader has to
   * be told rather than left to wonder why gold is "flat" to the tick.
   */
  barelyTraded: boolean;
  /** The date of the session these numbers describe, `YYYY-MM-DD`. */
  sessionDate: string;
  /** Intraday bars the balance reading was counted from. */
  intradayBars: number;
};

/** Intraday bars the balance and average readings look back over. */
const INTRADAY_LOOKBACK = 12;
const AVERAGE_LOOKBACK = 20;

/** Completed sessions the typical daily range is measured over. */
const RANGE_LOOKBACK = 10;

/**
 * Below this fraction of a normal range, the session has not really traded.
 *
 * A tenth. Gold on a Sunday shows a quarter-point range against a forty-point
 * average — arithmetic that is correct and tells the reader nothing except that
 * the market is shut.
 */
const BARELY_TRADED_BELOW = 0.1;

/**
 * How far price must move before a reading counts as anything but flat.
 *
 * A tenth of the instrument's own average daily range, not a fixed percentage:
 * gold routinely travels a percent in a morning and EUR/USD rarely does, so any
 * fixed threshold is either deaf on one and hysterical on the other. Scaling by
 * what the instrument actually does is the only version that reads the same on
 * both.
 */
const FLAT_BAND_FRACTION = 0.1;

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Enough decimals for the instrument, judged from its price.
 *
 * Gold at 2350 needs two; EUR/USD at 1.0854 needs four. Hardcoding either makes
 * one of them unreadable, and the provider does not say which is which.
 */
function priceDecimals(price: number): number {
  if (price >= 100) return 2;
  if (price >= 10) return 3;
  return 5;
}

function formatPrice(value: number, reference: number): string {
  return value.toFixed(priceDecimals(reference));
}

function signed(value: number, decimals: number): string {
  const rounded = round(value, decimals);
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(decimals)}`;
}

function directionOf(difference: number, flatBand: number): Direction {
  if (Math.abs(difference) <= flatBand) return "FLAT";
  return difference > 0 ? "UP" : "DOWN";
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** `YYYY-MM-DD` from a bar's time, which is a date string on daily series. */
function dateOf(candle: Candle): string {
  if (typeof candle.time === "string") return candle.time.slice(0, 10);
  return new Date(candle.time * 1000).toISOString().slice(0, 10);
}

/**
 * The readout for one instrument.
 *
 * `daily` and `intraday` are ascending, as `fetchCandles` returns them. Null
 * when there are not enough bars to say anything true: a readout built on one
 * candle would still draw an arrow, and a confident arrow drawn from nothing is
 * worse than an empty card.
 */
export function computeDayTape({
  symbol,
  label,
  daily,
  intraday,
  locale = "en",
}: {
  symbol: string;
  label: string;
  daily: Candle[];
  intraday: Candle[];
  /**
   * The language of the labels, not of the arithmetic.
   *
   * Defaulted, so the dashboard and the existing tests carry on unchanged —
   * only the public Lithuanian page passes anything else. The measurements are
   * identical either way; a reading that differed by language would be a bug
   * dressed as a feature.
   */
  locale?: Locale;
}): DayTape | null {
  const copy = tapeCopy(locale);

  if (daily.length < 2) return null;

  const today = daily[daily.length - 1];
  const yesterday = daily[daily.length - 2];

  const lastPrice = today.close;
  const decimals = priceDecimals(lastPrice);

  // Measured over completed sessions only — today's range is still growing and
  // including it would drag the yardstick towards whatever today happens to be.
  const completed = daily.slice(-1 - RANGE_LOOKBACK, -1);
  const ranges = completed
    .map((bar) => bar.high - bar.low)
    .filter((range) => range > 0);
  const averageRange = ranges.length > 0 ? mean(ranges) : null;

  // Falls back to a fraction of today's own range, then to a hair of the price,
  // so an instrument with no history still gets a sane dead zone rather than a
  // zero one that calls every tick a direction.
  const flatBand =
    averageRange !== null
      ? averageRange * FLAT_BAND_FRACTION
      : Math.max((today.high - today.low) * FLAT_BAND_FRACTION, lastPrice * 1e-5);

  const changeAbsolute = lastPrice - today.open;
  const changePercent =
    today.open > 0 ? round((changeAbsolute / today.open) * 100, 2) : 0;

  const readings: Reading[] = [];

  readings.push({
    key: "VS_OPEN",
    label: copy.vsOpen,
    direction: directionOf(changeAbsolute, flatBand),
    value: `${signed(changePercent, 2)}%`,
    detail: copy.vsOpenDetail(
      formatPrice(today.open, lastPrice),
      formatPrice(lastPrice, lastPrice),
    ),
  });

  const vsPriorClose = lastPrice - yesterday.close;
  readings.push({
    key: "VS_PRIOR_CLOSE",
    label: copy.vsPriorClose,
    direction: directionOf(vsPriorClose, flatBand),
    value: signed(vsPriorClose, decimals),
    detail: copy.vsPriorCloseDetail(formatPrice(yesterday.close, lastPrice)),
  });

  const dayRange = today.high - today.low;
  const rangePosition =
    dayRange > 0 ? round(((lastPrice - today.low) / dayRange) * 100, 0) : null;

  if (rangePosition !== null) {
    readings.push({
      key: "RANGE_POSITION",
      label: copy.rangePosition,
      // Dimensionless, so this one needs no volatility scaling: two thirds of
      // the way up is two thirds of the way up on any instrument.
      direction:
        rangePosition >= 67 ? "UP" : rangePosition <= 33 ? "DOWN" : "FLAT",
      value: `${rangePosition}%`,
      detail: copy.rangeDetail(
        formatPrice(today.low, lastPrice),
        formatPrice(today.high, lastPrice),
      ),
    });
  }

  const recent = intraday.slice(-INTRADAY_LOOKBACK);

  if (recent.length >= 4) {
    const up = recent.filter((bar) => bar.close > bar.open).length;
    const down = recent.filter((bar) => bar.close < bar.open).length;
    // A two-bar margin, so a 6/6 split is reported as the coin-flip it is
    // rather than rounded into a direction.
    const balance = up - down;

    readings.push({
      key: "INTRADAY_BARS",
      label: copy.intradayBars(recent.length),
      direction: balance >= 2 ? "UP" : balance <= -2 ? "DOWN" : "FLAT",
      value: copy.intradayValue(up, down),
      detail: copy.intradayDetail,
    });
  }

  const closes = intraday.slice(-AVERAGE_LOOKBACK).map((bar) => bar.close);

  if (closes.length >= 5) {
    const average = mean(closes);
    readings.push({
      key: "VS_AVERAGE",
      label: copy.vsAverage(closes.length),
      direction: directionOf(lastPrice - average, flatBand),
      value: signed(lastPrice - average, decimals),
      detail: copy.vsAverageDetail(
        closes.length,
        formatPrice(average, lastPrice),
      ),
    });
  }

  return {
    symbol,
    label,
    lastPrice: round(lastPrice, decimals),
    changeAbsolute: round(changeAbsolute, decimals),
    changePercent,
    direction: directionOf(changeAbsolute, flatBand),

    dayOpen: round(today.open, decimals),
    dayHigh: round(today.high, decimals),
    dayLow: round(today.low, decimals),
    rangePosition,

    readings,
    agreeing: {
      up: readings.filter((r) => r.direction === "UP").length,
      down: readings.filter((r) => r.direction === "DOWN").length,
      flat: readings.filter((r) => r.direction === "FLAT").length,
    },

    // Three decimals, not two: a Sunday's quarter-point range against a
    // forty-point average rounds to a flat zero at two, and "0× the average
    // range" reads as a bug rather than as a closed market.
    rangeVsAverage:
      averageRange !== null && averageRange > 0 && dayRange > 0
        ? round(dayRange / averageRange, 3)
        : null,
    barelyTraded:
      averageRange !== null &&
      averageRange > 0 &&
      dayRange / averageRange < BARELY_TRADED_BELOW,
    sessionDate: dateOf(today),
    intradayBars: recent.length,
  };
}
