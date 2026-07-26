import type { Trade } from "@/generated/prisma/client";
import { computeTradeMetrics } from "@/lib/ai/trade-metrics";
import { buildRCurve, type RCurve } from "./r-curve";
import {
  buildRDistribution,
  type RDistribution,
} from "./r-distribution";

/**
 * Everything the dashboard cards show, computed from the journal.
 *
 * One pass over the trades rather than a query per card: the page renders on
 * the server and every card wants the same rows.
 */

export type OpenPosition = {
  id: string;
  asset: string;
  direction: "BUY" | "SELL";
  entryPrice: number;
  /** Currency at risk if the stop is hit. Null when no stop was recorded. */
  riskAmount: number | null;
  riskPercent: number | null;
  openedAt: string;
};

export type ClosedTrade = {
  id: string;
  asset: string;
  direction: "BUY" | "SELL";
  realizedR: number | null;
  pnl: number | null;
  closedAt: string;
};

export type Exposure = {
  asset: string;
  /** Currency at risk across open positions in this instrument. */
  riskAmount: number;
  /** Share of total open risk, 0–100. */
  share: number;
};

export type Performance = {
  closedCount: number;
  winRatePercent: number | null;
  /** Sum of R across closed trades. */
  totalR: number | null;
  /** Average R per trade — the number that says whether the edge is real. */
  expectancyR: number | null;
  /**
   * Gross win R divided by gross loss R.
   *
   * Null rather than Infinity when there are no losses yet: a profit factor
   * with no losing trades in it is not a fact about an edge, it is a fact
   * about a small sample.
   */
  profitFactor: number | null;
  /** Trades with no stop recorded — undefined risk, worth surfacing. */
  withoutStop: number;
};

export type DashboardSummary = {
  openPositions: OpenPosition[];
  recentTrades: ClosedTrade[];
  exposure: Exposure[];
  performance: Performance;
  /** Null until there are two scored trades to draw a line through. */
  rCurve: RCurve | null;
  /** Null until at least one trade has an R. */
  rDistribution: RDistribution | null;
};

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function summariseTrades(trades: Trade[]): DashboardSummary {
  const openPositions: OpenPosition[] = [];
  const closed: { trade: Trade; realizedR: number | null }[] = [];
  const riskByAsset = new Map<string, number>();

  let withoutStop = 0;

  for (const trade of trades) {
    const metrics = computeTradeMetrics(trade);

    if (!metrics.flags.stopWasSet) withoutStop += 1;

    // Open means no exit was recorded, which is also how the metrics decide.
    if (metrics.exitClassification === "STILL_OPEN") {
      openPositions.push({
        id: trade.id,
        asset: trade.asset,
        direction: trade.direction,
        entryPrice: trade.entryPrice.toNumber(),
        riskAmount: metrics.riskAmount,
        riskPercent: metrics.riskPercent,
        openedAt: trade.createdAt.toISOString(),
      });

      if (metrics.riskAmount !== null) {
        riskByAsset.set(
          trade.asset,
          (riskByAsset.get(trade.asset) ?? 0) + metrics.riskAmount,
        );
      }

      continue;
    }

    closed.push({ trade, realizedR: metrics.realizedR });
  }

  /* ------------------------------------------------------------- exposure */

  const totalRisk = [...riskByAsset.values()].reduce((sum, r) => sum + r, 0);

  const exposure: Exposure[] = [...riskByAsset.entries()]
    .map(([asset, riskAmount]) => ({
      asset,
      riskAmount: round(riskAmount, 2),
      share: totalRisk > 0 ? round((riskAmount / totalRisk) * 100, 1) : 0,
    }))
    .sort((a, b) => b.riskAmount - a.riskAmount);

  /* ---------------------------------------------------------- performance */

  const scored = closed
    .map((entry) => entry.realizedR)
    .filter((r): r is number => r !== null);

  const wins = scored.filter((r) => r > 0);
  const losses = scored.filter((r) => r < 0);

  const grossWin = wins.reduce((sum, r) => sum + r, 0);
  const grossLoss = Math.abs(losses.reduce((sum, r) => sum + r, 0));
  const totalR = scored.reduce((sum, r) => sum + r, 0);

  const performance: Performance = {
    closedCount: closed.length,
    winRatePercent:
      scored.length > 0 ? round((wins.length / scored.length) * 100, 0) : null,
    totalR: scored.length > 0 ? round(totalR, 2) : null,
    expectancyR: scored.length > 0 ? round(totalR / scored.length, 2) : null,
    profitFactor: grossLoss > 0 ? round(grossWin / grossLoss, 2) : null,
    withoutStop,
  };

  /* -------------------------------------------------------- recent trades */

  const recentTrades: ClosedTrade[] = closed
    .slice(0, 6)
    .map(({ trade, realizedR }) => ({
      id: trade.id,
      asset: trade.asset,
      direction: trade.direction,
      realizedR,
      pnl: trade.pnl?.toNumber() ?? null,
      closedAt: (trade.closedAt ?? trade.createdAt).toISOString(),
    }));

  /* ------------------------------------------------------------- the curve */

  // Built from the same `closed` set the figures above come from, so the line
  // and the total can never disagree about what happened.
  const rCurve = buildRCurve(
    closed.map(({ trade, realizedR }) => ({
      closedAt: trade.closedAt,
      createdAt: trade.createdAt,
      asset: trade.asset,
      realizedR,
    })),
  );

  const rDistribution = buildRDistribution(scored);

  return {
    openPositions,
    recentTrades,
    exposure,
    performance,
    rCurve,
    rDistribution,
  };
}
