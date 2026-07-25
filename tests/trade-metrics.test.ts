import assert from "node:assert/strict";
import test from "node:test";
import {
  computePortfolioContext,
  computeTradeMetrics,
} from "../src/lib/ai/trade-metrics.ts";

const dec = (n: number | null) => (n === null ? null : { toNumber: () => n });

type AnyTrade = Parameters<typeof computeTradeMetrics>[0];

function makeTrade(o: Record<string, unknown>): AnyTrade {
  return {
    id: "t",
    userId: "u",
    asset: "XAUUSD",
    direction: "BUY",
    setup: null,
    timeframe: null,
    entryPrice: dec(2300),
    exitPrice: null,
    stopLoss: null,
    takeProfit: null,
    size: dec(1),
    contractSize: dec(1),
    pnl: null,
    accountBalance: null,
    marketContext: null,
    emotionalState: null,
    createdAt: new Date("2026-07-01T10:00:00Z"),
    closedAt: null,
    ...o,
  } as unknown as AnyTrade;
}

test("long trade that hits its target", () => {
  const m = computeTradeMetrics(
    makeTrade({
      entryPrice: dec(2300),
      stopLoss: dec(2290),
      takeProfit: dec(2330),
      exitPrice: dec(2330),
      size: dec(2),
      pnl: dec(60),
      accountBalance: dec(10000),
      closedAt: new Date("2026-07-01T12:30:00Z"),
    }),
  );

  assert.equal(m.plannedRiskPerUnit, 10);
  assert.equal(m.plannedRewardPerUnit, 30);
  assert.equal(m.plannedRR, 3);
  assert.equal(m.riskAmount, 20); // 10 * 2
  assert.equal(m.riskPercent, 0.2); // 20 / 10000
  assert.equal(m.realizedR, 3); // 60 / 20
  assert.equal(m.exitClassification, "HIT_TARGET");
  assert.equal(m.holdingMinutes, 150);
  assert.equal(m.flags.riskAboveTwoPercent, false);
});

test("short trade that hits its stop", () => {
  const m = computeTradeMetrics(
    makeTrade({
      direction: "SELL",
      entryPrice: dec(1.1),
      stopLoss: dec(1.12),
      takeProfit: dec(1.06),
      exitPrice: dec(1.12),
      size: dec(100000),
      pnl: dec(-2000),
      accountBalance: dec(50000),
    }),
  );

  assert.ok(Math.abs(m.plannedRiskPerUnit! - 0.02) < 1e-9);
  assert.equal(m.plannedRR, 2);
  assert.equal(m.riskAmount, 2000);
  assert.equal(m.riskPercent, 4);
  assert.equal(m.realizedR, -1);
  assert.equal(m.exitClassification, "HIT_STOP");
  assert.equal(m.flags.riskAboveTwoPercent, true);
});

test("stop on the wrong side of entry is not treated as risk", () => {
  const m = computeTradeMetrics(
    makeTrade({
      entryPrice: dec(2300),
      stopLoss: dec(2310), // above entry on a long — would fill instantly
      exitPrice: dec(2305),
      pnl: dec(5),
    }),
  );

  assert.equal(m.flags.stopOnWrongSideOfEntry, true);
  assert.equal(m.plannedRiskPerUnit, null);
  assert.equal(m.riskAmount, null);
  assert.equal(m.realizedR, null);
});

test("no stop means undefined risk, not zero risk", () => {
  const m = computeTradeMetrics(
    makeTrade({ exitPrice: dec(2350), pnl: dec(50) }),
  );

  assert.equal(m.flags.stopWasSet, false);
  assert.equal(m.riskAmount, null);
  assert.equal(m.riskPercent, null);
  assert.equal(m.realizedR, null);
  assert.equal(m.exitClassification, "UNKNOWN");
});

test("discretionary exit between stop and target", () => {
  const m = computeTradeMetrics(
    makeTrade({
      entryPrice: dec(2300),
      stopLoss: dec(2290),
      takeProfit: dec(2330),
      exitPrice: dec(2312),
      pnl: dec(12),
    }),
  );

  assert.equal(m.exitClassification, "DISCRETIONARY_EXIT");
  assert.equal(m.realizedR, 1.2);
});

test("open trade", () => {
  const m = computeTradeMetrics(
    makeTrade({ stopLoss: dec(2290), takeProfit: dec(2330) }),
  );

  assert.equal(m.exitClassification, "STILL_OPEN");
  assert.equal(m.holdingMinutes, null);
});

test("planned RR below one is flagged", () => {
  const m = computeTradeMetrics(
    makeTrade({ stopLoss: dec(2280), takeProfit: dec(2310) }),
  );

  // risk 2300 -> 2280 = 20; reward 2300 -> 2310 = 10; RR = 0.5
  assert.equal(m.plannedRR, 0.5);
  assert.equal(m.flags.plannedRRBelowOne, true);
});

test("contract size scales risk (0.5 XAUUSD lots = 50 oz)", () => {
  const m = computeTradeMetrics(
    makeTrade({
      entryPrice: dec(2345.67),
      stopLoss: dec(2338.2),
      takeProfit: dec(2367),
      exitPrice: dec(2352.1),
      size: dec(0.5),
      contractSize: dec(100), // one XAUUSD lot = 100 oz
      pnl: dec(321.5),
      accountBalance: dec(25000),
    }),
  );

  assert.equal(m.exposureUnits, 50);
  assert.equal(m.plannedRiskPerUnit, 7.47);
  assert.equal(m.riskAmount, 373.5); // 7.47 * 50, not 7.47 * 0.5
  assert.equal(m.riskPercent, 1.494);
  assert.equal(m.realizedR, 0.86);
  assert.equal(m.plannedRR, 2.86);
  assert.equal(m.exitClassification, "DISCRETIONARY_EXIT");
});

test("portfolio context aggregates prior trades only", () => {
  const base = {
    stopLoss: dec(2290),
    takeProfit: dec(2330),
    size: dec(1),
    accountBalance: dec(10000),
  };

  const history = [
    makeTrade({ ...base, id: "a", pnl: dec(20), createdAt: new Date("2026-07-01T01:00:00Z") }),
    makeTrade({ ...base, id: "b", pnl: dec(-10), createdAt: new Date("2026-07-01T02:00:00Z") }),
    makeTrade({ ...base, id: "c", pnl: dec(-10), createdAt: new Date("2026-07-01T03:00:00Z") }),
    // after the current trade — must be excluded
    makeTrade({ ...base, id: "z", pnl: dec(100), createdAt: new Date("2026-07-02T00:00:00Z") }),
  ];

  const current = makeTrade({ ...base, id: "cur", createdAt: new Date("2026-07-01T10:00:00Z") });
  const ctx = computePortfolioContext(history, current);

  assert.equal(ctx.sampleSize, 3);
  assert.equal(ctx.winRatePercent, 33.3); // 1 of 3
  assert.equal(ctx.averageWinR, 2);
  assert.equal(ctx.averageLossR, -1);
  assert.equal(ctx.worstLossR, -1);
  assert.equal(ctx.expectancyR, 0); // (2 - 1 - 1) / 3
  assert.equal(ctx.losingStreakBefore, 2); // c then b
  assert.equal(ctx.medianRiskPercent, 0.1);
});
