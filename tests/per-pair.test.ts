import assert from "node:assert/strict";
import test from "node:test";
import { analyseJournal, sessionOf } from "../src/lib/analysis/per-pair.ts";

const dec = (n: number | null) => (n === null ? null : { toNumber: () => n });

type AnyTrade = Parameters<typeof analyseJournal>[0][number];

/**
 * A closed trade with a defined risk of 10 per unit on 1 unit, so `pnl` in
 * currency is the R-multiple. Keeps the arithmetic out of the assertions.
 */
function trade(o: {
  id?: string;
  asset?: string;
  openedAt: string;
  r?: number | null;
  balance?: number | null;
  open?: boolean;
  noStop?: boolean;
  notes?: boolean;
}): AnyTrade {
  const closed = o.open !== true;

  return {
    id: o.id ?? o.openedAt,
    userId: "u",
    source: "MANUAL",
    externalId: null,
    asset: o.asset ?? "XAUUSD",
    direction: "BUY",
    setup: null,
    timeframe: null,
    entryPrice: dec(2300),
    exitPrice: closed ? dec(2310) : null,
    stopLoss: o.noStop ? null : dec(2290),
    takeProfit: dec(2330),
    size: dec(1),
    contractSize: dec(1),
    // risk = 10 per unit x 1 unit, so pnl of 10 is exactly +1R.
    pnl: closed && o.r !== undefined && o.r !== null ? dec(o.r * 10) : null,
    accountBalance: o.balance === undefined ? dec(1000) : dec(o.balance),
    marketContext: o.notes ? "context" : null,
    emotionalState: null,
    createdAt: new Date(o.openedAt),
    closedAt: closed ? new Date(o.openedAt) : null,
  } as unknown as AnyTrade;
}

test("sessions are non-overlapping and cover the clock", () => {
  const seen = new Set<string>();
  for (let hour = 0; hour < 24; hour += 1) {
    const at = new Date(Date.UTC(2026, 6, 1, hour));
    seen.add(sessionOf(at));
  }

  assert.deepEqual(
    [...seen].sort(),
    ["ASIA", "LONDON", "NEW_YORK", "OFF_HOURS", "OVERLAP"],
  );
});

test("session boundaries land on the right side", () => {
  const at = (hour: number) => new Date(Date.UTC(2026, 6, 1, hour));

  assert.equal(sessionOf(at(6)), "ASIA");
  assert.equal(sessionOf(at(7)), "LONDON");
  assert.equal(sessionOf(at(11)), "LONDON");
  assert.equal(sessionOf(at(12)), "OVERLAP");
  assert.equal(sessionOf(at(15)), "OVERLAP");
  assert.equal(sessionOf(at(16)), "NEW_YORK");
  assert.equal(sessionOf(at(20)), "NEW_YORK");
  assert.equal(sessionOf(at(21)), "OFF_HOURS");
  assert.equal(sessionOf(at(23)), "ASIA");
  assert.equal(sessionOf(at(0)), "ASIA");
});

test("splits the journal by instrument, most-traded first", () => {
  const analysis = analyseJournal([
    trade({ asset: "EURUSD", openedAt: "2026-07-01T08:00:00Z", r: 1 }),
    trade({ asset: "XAUUSD", openedAt: "2026-07-02T08:00:00Z", r: 1 }),
    trade({ asset: "XAUUSD", openedAt: "2026-07-03T08:00:00Z", r: -1 }),
  ]);

  assert.deepEqual(
    analysis.pairs.map((p) => p.asset),
    ["XAUUSD", "EURUSD"],
  );
  assert.equal(analysis.totalTrades, 3);
  assert.equal(analysis.totalScored, 3);
});

test("win rate, expectancy and total come from the realised P&L", () => {
  // The builder writes `pnl` as ten currency units per R, so these four are
  // +20, −10, −10, +20.
  const [pair] = analyseJournal([
    trade({ openedAt: "2026-07-01T08:00:00Z", r: 2 }),
    trade({ openedAt: "2026-07-02T08:00:00Z", r: -1 }),
    trade({ openedAt: "2026-07-03T08:00:00Z", r: -1 }),
    trade({ openedAt: "2026-07-06T08:00:00Z", r: 2 }),
  ]).pairs;

  assert.equal(pair.scored, 4);
  assert.equal(pair.winRatePercent, 50);
  assert.equal(pair.totalPnl, 20);
  assert.equal(pair.expectancyPnl, 5);
  assert.equal(pair.averageWin, 20);
  assert.equal(pair.averageLoss, -10);
  assert.equal(pair.worstLoss, -10);
});

test("an open trade counts as a trade but never as a result", () => {
  const [pair] = analyseJournal([
    trade({ openedAt: "2026-07-01T08:00:00Z", r: 1 }),
    trade({ openedAt: "2026-07-02T08:00:00Z", open: true }),
  ]).pairs;

  assert.equal(pair.trades, 2);
  assert.equal(pair.scored, 1);
  assert.equal(pair.openTrades, 1);
  assert.equal(pair.winRatePercent, 100);
});

test("a trade with no stop still counts, but is flagged as undefined risk", () => {
  const [pair] = analyseJournal([
    trade({ openedAt: "2026-07-01T08:00:00Z", r: 1 }),
    trade({ openedAt: "2026-07-02T08:00:00Z", r: 1, noStop: true }),
  ]).pairs;

  assert.equal(pair.trades, 2);
  assert.equal(pair.withoutStop, 1);
  // It made money, so it scores. This is the difference the move from R to P&L
  // makes: R needed a stop to exist at all, which silently dropped more than
  // half of a real journal out of every figure on the page. The trade is still
  // counted apart, because nothing here can say whether its size was sensible.
  assert.equal(pair.scored, 2);
});

test("risk is compared against the trader's own median, not a rule of thumb", () => {
  // EURUSD risks 1% of 1000; XAUUSD risks 4% by holding a tenth the balance.
  const analysis = analyseJournal([
    trade({ asset: "EURUSD", openedAt: "2026-07-01T08:00:00Z", r: 1 }),
    trade({ asset: "EURUSD", openedAt: "2026-07-02T08:00:00Z", r: 1 }),
    trade({ asset: "EURUSD", openedAt: "2026-07-03T08:00:00Z", r: 1 }),
    trade({
      asset: "XAUUSD",
      openedAt: "2026-07-06T08:00:00Z",
      r: -1,
      balance: 250,
    }),
  ]);

  const gold = analysis.pairs.find((p) => p.asset === "XAUUSD");
  const euro = analysis.pairs.find((p) => p.asset === "EURUSD");

  assert.equal(analysis.medianRiskPercent, 1);
  assert.equal(gold?.medianRiskPercent, 4);
  assert.equal(gold?.riskVsOwnMedian, 4);
  assert.equal(euro?.riskVsOwnMedian, 1);
});

test("the previous result is the previous trade in the journal, across pairs", () => {
  const analysis = analyseJournal([
    trade({ asset: "EURUSD", openedAt: "2026-07-01T08:00:00Z", r: -1 }),
    trade({ asset: "XAUUSD", openedAt: "2026-07-01T09:00:00Z", r: -1 }),
    trade({ asset: "XAUUSD", openedAt: "2026-07-01T10:00:00Z", r: -1 }),
    trade({ asset: "XAUUSD", openedAt: "2026-07-01T11:00:00Z", r: 3 }),
  ]);

  const gold = analysis.pairs.find((p) => p.asset === "XAUUSD");
  const afterLoss = gold?.afterResult.find((b) => b.key === "AFTER_LOSS");
  const afterWin = gold?.afterResult.find((b) => b.key === "AFTER_WIN");

  // All three gold trades follow a loss — the first of them follows the euro
  // loss, which is the point of counting across pairs.
  assert.equal(afterLoss?.trades, 3);
  assert.equal(afterLoss?.winRatePercent, 33.3);
  assert.equal(afterWin, undefined);
});

test("an unresolved trade does not break the streak", () => {
  const analysis = analyseJournal([
    trade({ openedAt: "2026-07-01T08:00:00Z", r: -1 }),
    trade({ openedAt: "2026-07-01T09:00:00Z", open: true }),
    trade({ openedAt: "2026-07-01T10:00:00Z", r: 1 }),
  ]);

  const afterLoss = analysis.pairs[0].afterResult.find(
    (b) => b.key === "AFTER_LOSS",
  );

  // The open position and the trade after it both still follow the loss.
  assert.equal(afterLoss?.trades, 2);
  assert.equal(afterLoss?.scored, 1);
});

test("buckets with no trades are left out rather than shown as zero", () => {
  const [pair] = analyseJournal([
    trade({ openedAt: "2026-07-01T08:00:00Z", r: 1 }),
  ]).pairs;

  assert.deepEqual(
    pair.sessions.map((b) => b.key),
    ["LONDON"],
  );
  assert.deepEqual(
    pair.weekdays.map((b) => b.label),
    ["Wednesday"],
  );
});

test("an empty journal produces no pairs and no median", () => {
  const analysis = analyseJournal([]);

  assert.deepEqual(analysis.pairs, []);
  assert.equal(analysis.medianRiskPercent, null);
  assert.equal(analysis.totalTrades, 0);
});

test("the worst day sums the trades on it, and can beat a bigger single loss", () => {
  // The point of the figure. Three losses of 10 on one morning is a worse day
  // than one loss of 20 on another, and reporting only the biggest single
  // trade never shows that day happened at all.
  const [pair] = analyseJournal([
    trade({ openedAt: "2026-07-01T08:00:00Z", r: -1 }),
    trade({ openedAt: "2026-07-01T10:00:00Z", r: -1 }),
    trade({ openedAt: "2026-07-01T14:00:00Z", r: -1 }),
    trade({ openedAt: "2026-07-02T08:00:00Z", r: -2 }),
  ]).pairs;

  assert.equal(pair.worstDay?.total, -30);
  assert.equal(pair.worstDay?.date, "2026-07-01");
  assert.equal(pair.worstDay?.trades, 3);

  // The single worst trade is still available, and is a different number.
  assert.equal(pair.worstLoss, -20);
});

test("a day that finished up is not a worst day", () => {
  // Two losses and a bigger win on the same date nets positive, so there is no
  // losing day to report. Null rather than zero: no day finished down is a
  // fact, and dressing it up as a break-even day would be a different claim.
  const [pair] = analyseJournal([
    trade({ openedAt: "2026-07-01T08:00:00Z", r: -1 }),
    trade({ openedAt: "2026-07-01T10:00:00Z", r: -1 }),
    trade({ openedAt: "2026-07-01T14:00:00Z", r: 3 }),
  ]).pairs;

  assert.equal(pair.worstDay, null);
  // The worst trade still exists — it just did not make the day a losing one.
  assert.equal(pair.worstLoss, -10);
});
