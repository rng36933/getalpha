import type { Trade } from "@/generated/prisma/client";

/**
 * Everything quantitative about a trade is computed here, in code, and handed
 * to the model as finished numbers.
 *
 * Language models are unreliable at arithmetic and will confidently misreport
 * an R-multiple. A review built on a wrong R is worse than no review, so the
 * model is never asked to calculate — only to judge.
 */

export type TradeMetrics = {
  /** Distance from entry to stop, per unit. Null when no stop was recorded. */
  plannedRiskPerUnit: number | null;
  plannedRewardPerUnit: number | null;
  /** Planned reward-to-risk ratio, e.g. 2.5 means 2.5R target. */
  plannedRR: number | null;
  /** Total currency at risk if the stop had been hit, contract size applied. */
  riskAmount: number | null;
  /** size * contractSize — the exposure the risk figure is based on. */
  exposureUnits: number;
  /** Risk as a percentage of account equity at entry. */
  riskPercent: number | null;
  /** Realised result expressed in R. -1 means a full planned loss. */
  realizedR: number | null;
  /** How the position actually ended, inferred from the exit price. */
  exitClassification:
    | "HIT_TARGET"
    | "HIT_STOP"
    | "DISCRETIONARY_EXIT"
    | "BEYOND_TARGET"
    | "BEYOND_STOP"
    | "STILL_OPEN"
    | "UNKNOWN";
  holdingMinutes: number | null;
  /** Process facts a reviewer would otherwise have to infer. */
  flags: {
    stopWasSet: boolean;
    targetWasSet: boolean;
    stopOnWrongSideOfEntry: boolean;
    targetOnWrongSideOfEntry: boolean;
    riskAboveTwoPercent: boolean;
    plannedRRBelowOne: boolean;
    contextNoteMissing: boolean;
    emotionNoteMissing: boolean;
  };
};

export type PortfolioContext = {
  sampleSize: number;
  winRatePercent: number | null;
  expectancyR: number | null;
  averageWinR: number | null;
  averageLossR: number | null;
  worstLossR: number | null;
  medianRiskPercent: number | null;
  /** Consecutive losses immediately before this trade. */
  losingStreakBefore: number;
};

function toNumber(value: { toNumber(): number } | null): number | null {
  return value === null ? null : value.toNumber();
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function computeTradeMetrics(trade: Trade): TradeMetrics {
  const entry = trade.entryPrice.toNumber();
  const size = trade.size.toNumber();
  const exit = toNumber(trade.exitPrice);
  const stop = toNumber(trade.stopLoss);
  const target = toNumber(trade.takeProfit);
  const pnl = toNumber(trade.pnl);
  const balance = toNumber(trade.accountBalance);
  const isLong = trade.direction === "BUY";

  // A stop on the wrong side of entry is not a stop — it would be filled
  // immediately — so it must not be used as a risk denominator.
  const stopOnWrongSide =
    stop !== null && (isLong ? stop >= entry : stop <= entry);
  const targetOnWrongSide =
    target !== null && (isLong ? target <= entry : target >= entry);

  const plannedRiskPerUnit =
    stop !== null && !stopOnWrongSide ? Math.abs(entry - stop) : null;
  const plannedRewardPerUnit =
    target !== null && !targetOnWrongSide ? Math.abs(target - entry) : null;

  const plannedRR =
    plannedRiskPerUnit !== null &&
    plannedRiskPerUnit > 0 &&
    plannedRewardPerUnit !== null
      ? round(plannedRewardPerUnit / plannedRiskPerUnit, 2)
      : null;

  // size is quoted in lots for most brokers, so it must be scaled to units
  // before it can be multiplied by a per-unit price distance.
  const exposureUnits = size * trade.contractSize.toNumber();

  const riskAmount =
    plannedRiskPerUnit !== null
      ? round(plannedRiskPerUnit * exposureUnits, 2)
      : null;

  const riskPercent =
    riskAmount !== null && balance !== null && balance > 0
      ? round((riskAmount / balance) * 100, 3)
      : null;

  const realizedR =
    pnl !== null && riskAmount !== null && riskAmount > 0
      ? round(pnl / riskAmount, 2)
      : null;

  const holdingMinutes =
    trade.closedAt !== null
      ? Math.round(
          (trade.closedAt.getTime() - trade.createdAt.getTime()) / 60_000,
        )
      : null;

  return {
    plannedRiskPerUnit:
      plannedRiskPerUnit !== null ? round(plannedRiskPerUnit, 8) : null,
    plannedRewardPerUnit:
      plannedRewardPerUnit !== null ? round(plannedRewardPerUnit, 8) : null,
    plannedRR,
    riskAmount,
    exposureUnits: round(exposureUnits, 4),
    riskPercent,
    realizedR,
    exitClassification: classifyExit({
      exit,
      stop: stopOnWrongSide ? null : stop,
      target: targetOnWrongSide ? null : target,
      isLong,
    }),
    holdingMinutes,
    flags: {
      stopWasSet: stop !== null,
      targetWasSet: target !== null,
      stopOnWrongSideOfEntry: stopOnWrongSide,
      targetOnWrongSideOfEntry: targetOnWrongSide,
      riskAboveTwoPercent: riskPercent !== null && riskPercent > 2,
      plannedRRBelowOne: plannedRR !== null && plannedRR < 1,
      contextNoteMissing:
        trade.marketContext === null || trade.marketContext.trim() === "",
      emotionNoteMissing:
        trade.emotionalState === null || trade.emotionalState.trim() === "",
    },
  };
}

function classifyExit({
  exit,
  stop,
  target,
  isLong,
}: {
  exit: number | null;
  stop: number | null;
  target: number | null;
  isLong: boolean;
}): TradeMetrics["exitClassification"] {
  if (exit === null) return "STILL_OPEN";
  if (stop === null && target === null) return "UNKNOWN";

  // Prices rarely fill to the tick; treat a near-touch as the level.
  const reference = Math.abs(target ?? stop ?? exit);
  const tolerance = Math.max(reference * 0.0002, 1e-8);

  if (target !== null) {
    if (Math.abs(exit - target) <= tolerance) return "HIT_TARGET";
    if (isLong ? exit > target : exit < target) return "BEYOND_TARGET";
  }

  if (stop !== null) {
    if (Math.abs(exit - stop) <= tolerance) return "HIT_STOP";
    if (isLong ? exit < stop : exit > stop) return "BEYOND_STOP";
  }

  return "DISCRETIONARY_EXIT";
}

/**
 * Aggregates the trader's recent history so the review can say "this is your
 * third-largest risk of the last 50 trades" instead of judging in isolation.
 */
export function computePortfolioContext(
  history: Trade[],
  current: Trade,
): PortfolioContext {
  const earlier = history
    .filter((t) => t.id !== current.id && t.createdAt < current.createdAt)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const rMultiples: number[] = [];
  const riskPercents: number[] = [];

  for (const trade of earlier) {
    const metrics = computeTradeMetrics(trade);
    if (metrics.realizedR !== null) rMultiples.push(metrics.realizedR);
    if (metrics.riskPercent !== null) riskPercents.push(metrics.riskPercent);
  }

  const wins = rMultiples.filter((r) => r > 0);
  const losses = rMultiples.filter((r) => r <= 0);

  const averageWinR = wins.length > 0 ? round(mean(wins), 2) : null;
  const averageLossR = losses.length > 0 ? round(mean(losses), 2) : null;

  let losingStreakBefore = 0;
  for (const trade of earlier) {
    const pnl = toNumber(trade.pnl);
    if (pnl === null || pnl >= 0) break;
    losingStreakBefore += 1;
  }

  return {
    sampleSize: earlier.length,
    winRatePercent:
      rMultiples.length > 0
        ? round((wins.length / rMultiples.length) * 100, 1)
        : null,
    expectancyR: rMultiples.length > 0 ? round(mean(rMultiples), 2) : null,
    averageWinR,
    averageLossR,
    worstLossR: rMultiples.length > 0 ? round(Math.min(...rMultiples), 2) : null,
    medianRiskPercent: riskPercents.length > 0 ? round(median(riskPercents), 3) : null,
    losingStreakBefore,
  };
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
