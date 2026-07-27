import type { Trade } from "@/generated/prisma/client";
// Relative and with the extension, unlike the `@/` imports elsewhere: this
// module is covered by `npm test`, and the bare node test runner resolves
// neither the path alias nor a missing extension.
import { computeTradeMetrics } from "../ai/trade-metrics.ts";

/**
 * What one trader's own record says about one instrument.
 *
 * Every figure here is counted, not predicted. Nothing in this file knows
 * anything about the market — it knows what this person did, and only reports
 * back what they would find by reading their own journal with a calculator.
 *
 * The same rule as the AI modules: arithmetic in TypeScript, judgement
 * elsewhere. See `trade-metrics.ts`.
 */

/**
 * Where in the trading day a trade was opened, in UTC.
 *
 * Non-overlapping on purpose. London and New York genuinely overlap, and
 * putting a 14:00 trade in both would make the counts add up to more than the
 * trades taken. The overlap is its own bucket instead — it is the busiest part
 * of the day and worth being able to see on its own.
 */
export const SESSIONS = [
  "ASIA",
  "LONDON",
  "OVERLAP",
  "NEW_YORK",
  "OFF_HOURS",
] as const;

export type Session = (typeof SESSIONS)[number];

export const SESSION_LABEL: Record<Session, string> = {
  ASIA: "Asia",
  LONDON: "London",
  OVERLAP: "London/NY overlap",
  NEW_YORK: "New York",
  OFF_HOURS: "Off hours",
};

export const SESSION_HOURS: Record<Session, string> = {
  ASIA: "23:00–07:00 UTC",
  LONDON: "07:00–12:00 UTC",
  OVERLAP: "12:00–16:00 UTC",
  NEW_YORK: "16:00–21:00 UTC",
  OFF_HOURS: "21:00–23:00 UTC",
};

export function sessionOf(openedAt: Date): Session {
  const hour = openedAt.getUTCHours();
  if (hour >= 7 && hour < 12) return "LONDON";
  if (hour >= 12 && hour < 16) return "OVERLAP";
  if (hour >= 16 && hour < 21) return "NEW_YORK";
  if (hour >= 21 && hour < 23) return "OFF_HOURS";
  return "ASIA";
}

export const WEEKDAY_LABEL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** One slice of the record — a session, a weekday, a state of mind. */
export type Bucket = {
  key: string;
  label: string;
  /** Trades opened in this slice, including ones still open. */
  trades: number;
  /** Of those, the ones that have closed with a result. */
  scored: number;
  winRatePercent: number | null;
  totalPnl: number | null;
  expectancyPnl: number | null;
};

export type PairBreakdown = {
  asset: string;
  trades: number;
  /** Trades that closed with a result. Everything below rests on it. */
  scored: number;
  openTrades: number;
  /**
   * Trades with no stop recorded.
   *
   * They still count towards every figure here, because a result in money
   * exists whether or not a stop was set. What they cannot say is whether the
   * size was sensible — there was no defined risk to compare it against.
   */
  withoutStop: number;
  /** Scored trades still missing the two written notes. */
  withoutNotes: number;

  winRatePercent: number | null;
  totalPnl: number | null;
  expectancyPnl: number | null;
  averageWin: number | null;
  averageLoss: number | null;
  /** The single worst trade. Kept, but it is not the headline — see below. */
  worstLoss: number | null;
  /**
   * The worst day this instrument had, summed across every trade on it.
   *
   * Null when no day finished down. This is the headline rather than
   * `worstLoss` because a day is what a person lives through and what a
   * drawdown is made of; the single trade beside it says whether that day was
   * one decision or a run of them.
   */
  worstDay: { total: number; date: string; trades: number } | null;

  medianRiskPercent: number | null;
  /**
   * This pair's median risk divided by the median across the whole journal.
   * 1.4 means they habitually stake 40% more here than they do elsewhere.
   */
  riskVsOwnMedian: number | null;

  sessions: Bucket[];
  weekdays: Bucket[];
  /** Two buckets: the trade after a loss, and the trade after a win. */
  afterResult: Bucket[];

  firstTradeAt: string;
  lastTradeAt: string;
};

export type JournalAnalysis = {
  pairs: PairBreakdown[];
  /** Median risk-percent across every scored trade, the yardstick above. */
  medianRiskPercent: number | null;
  totalTrades: number;
  totalScored: number;
};

type Scored = {
  asset: string;
  openedAt: Date;
  pnl: number | null;
  riskPercent: number | null;
  hasStop: boolean;
  hasNotes: boolean;
  isOpen: boolean;
  /** The result of the previous trade in the journal, whatever its pair. */
  previous: "WIN" | "LOSS" | null;
};

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * The worst single day, summed.
 *
 * The worst *trade* is the number a journal usually shows, and on its own it
 * understates the risk being run: three losses of 70 on one morning is a worse
 * day than one loss of 202, and a page that only reports the biggest single
 * trade never shows it happened. This is the number a drawdown is actually made
 * of.
 *
 * Grouped by UTC day, like the weekday buckets above, and by the day a trade
 * was opened — which is what the record carries. A position opened before
 * midnight and closed after it counts to the day it was entered, which is also
 * the day the decision was made.
 *
 * Null when no day finished down. That is a fact worth not dressing up as a
 * zero.
 */
function worstDayOf(
  rows: Scored[],
): { total: number; date: string; trades: number } | null {
  const byDay = new Map<string, { total: number; trades: number }>();

  for (const row of rows) {
    if (row.pnl === null) continue;

    const date = row.openedAt.toISOString().slice(0, 10);
    const day = byDay.get(date) ?? { total: 0, trades: 0 };

    day.total += row.pnl;
    day.trades += 1;
    byDay.set(date, day);
  }

  let worst: { total: number; date: string; trades: number } | null = null;

  for (const [date, day] of byDay) {
    if (day.total >= 0) continue;
    if (worst === null || day.total < worst.total) {
      worst = { total: round(day.total, 2), date, trades: day.trades };
    }
  }

  return worst;
}

function summarise(key: string, label: string, rows: Scored[]): Bucket {
  const rs = rows.map((row) => row.pnl).filter((r): r is number => r !== null);
  const wins = rs.filter((r) => r > 0).length;

  return {
    key,
    label,
    trades: rows.length,
    scored: rs.length,
    winRatePercent: rs.length > 0 ? round((wins / rs.length) * 100, 1) : null,
    totalPnl: rs.length > 0 ? round(rs.reduce((sum, r) => sum + r, 0), 2) : null,
    expectancyPnl: rs.length > 0 ? round(mean(rs), 2) : null,
  };
}

/**
 * Turns a journal into one breakdown per instrument.
 *
 * `trades` may arrive in any order; the "after a loss" bucket needs them
 * chronological and sorts them itself rather than trusting the caller.
 */
export function analyseJournal(trades: Trade[]): JournalAnalysis {
  const chronological = [...trades].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  const scored: Scored[] = [];
  let previous: "WIN" | "LOSS" | null = null;

  for (const trade of chronological) {
    const metrics = computeTradeMetrics(trade);
    const pnl = trade.pnl?.toNumber() ?? null;

    scored.push({
      asset: trade.asset,
      openedAt: trade.createdAt,
      pnl,
      riskPercent: metrics.riskPercent,
      hasStop: metrics.flags.stopWasSet && !metrics.flags.stopOnWrongSideOfEntry,
      hasNotes:
        !metrics.flags.contextNoteMissing || !metrics.flags.emotionNoteMissing,
      isOpen: trade.closedAt === null,
      previous,
    });

    // Only a resolved trade moves the streak on. An open position has not gone
    // either way yet, and calling it a win because it is green would make the
    // next trade's label depend on when the page was loaded.
    //
    // A scratch counts as a loss here rather than being skipped: "the trade
    // after a break-even" is not a bucket anybody reasons about, and dropping
    // it would silently attach the next trade to the result before it.
    if (pnl !== null) {
      previous = pnl > 0 ? "WIN" : "LOSS";
    }
  }

  const allRisks = scored
    .map((row) => row.riskPercent)
    .filter((value): value is number => value !== null);
  const journalMedianRisk =
    allRisks.length > 0 ? round(median(allRisks), 3) : null;

  const byAsset = new Map<string, Scored[]>();
  for (const row of scored) {
    const existing = byAsset.get(row.asset);
    if (existing) existing.push(row);
    else byAsset.set(row.asset, [row]);
  }

  const pairs = [...byAsset.entries()].map(([asset, rows]) =>
    breakdownFor(asset, rows, journalMedianRisk),
  );

  // Most-traded first: the pair with the most evidence behind it is the one
  // worth reading, not whichever sorts first alphabetically.
  pairs.sort((a, b) => b.scored - a.scored || b.trades - a.trades);

  return {
    pairs,
    medianRiskPercent: journalMedianRisk,
    totalTrades: scored.length,
    totalScored: scored.filter((row) => row.pnl !== null).length,
  };
}

function breakdownFor(
  asset: string,
  rows: Scored[],
  journalMedianRisk: number | null,
): PairBreakdown {
  const rs = rows.map((row) => row.pnl).filter((r): r is number => r !== null);
  const wins = rs.filter((r) => r > 0);
  const losses = rs.filter((r) => r <= 0);

  const risks = rows
    .map((row) => row.riskPercent)
    .filter((value): value is number => value !== null);
  const medianRisk = risks.length > 0 ? round(median(risks), 3) : null;

  const worstDay = worstDayOf(rows);

  const sessions = SESSIONS.map((session) =>
    summarise(
      session,
      SESSION_LABEL[session],
      rows.filter((row) => sessionOf(row.openedAt) === session),
    ),
  ).filter((bucket) => bucket.trades > 0);

  const weekdays = WEEKDAY_LABEL.map((label, day) =>
    summarise(
      String(day),
      label,
      rows.filter((row) => row.openedAt.getUTCDay() === day),
    ),
  ).filter((bucket) => bucket.trades > 0);

  const afterResult = [
    summarise(
      "AFTER_LOSS",
      "Straight after a loss",
      rows.filter((row) => row.previous === "LOSS"),
    ),
    summarise(
      "AFTER_WIN",
      "Straight after a win",
      rows.filter((row) => row.previous === "WIN"),
    ),
  ].filter((bucket) => bucket.trades > 0);

  const dates = rows.map((row) => row.openedAt.getTime());

  return {
    asset,
    trades: rows.length,
    scored: rs.length,
    openTrades: rows.filter((row) => row.isOpen).length,
    withoutStop: rows.filter((row) => !row.hasStop).length,
    withoutNotes: rows.filter((row) => !row.hasNotes).length,

    winRatePercent:
      rs.length > 0 ? round((wins.length / rs.length) * 100, 1) : null,
    totalPnl: rs.length > 0 ? round(rs.reduce((sum, r) => sum + r, 0), 2) : null,
    expectancyPnl: rs.length > 0 ? round(mean(rs), 2) : null,
    averageWin: wins.length > 0 ? round(mean(wins), 2) : null,
    averageLoss: losses.length > 0 ? round(mean(losses), 2) : null,
    worstLoss: rs.length > 0 ? round(Math.min(...rs), 2) : null,
    worstDay,

    medianRiskPercent: medianRisk,
    riskVsOwnMedian:
      medianRisk !== null && journalMedianRisk !== null && journalMedianRisk > 0
        ? round(medianRisk / journalMedianRisk, 2)
        : null,

    sessions,
    weekdays,
    afterResult,

    firstTradeAt: new Date(Math.min(...dates)).toISOString(),
    lastTradeAt: new Date(Math.max(...dates)).toISOString(),
  };
}

/**
 * How many scored trades a slice needs before its win rate means anything.
 *
 * Five is not a statistical threshold, and nothing here pretends otherwise. It
 * is the point below which a percentage is more misleading than a raw count —
 * "100% on Tuesdays" out of one trade is a sentence that should never be
 * printed. Below it the UI shows the count and withholds the rate.
 */
export const MIN_SAMPLE_FOR_RATE = 5;
