import assert from "node:assert/strict";
import test from "node:test";
import { buildRCurve } from "../src/lib/dashboard/r-curve.ts";

const at = (day: number) => new Date(Date.UTC(2026, 6, day));

const trade = (day: number, realizedR: number | null, asset = "XAUUSD") => ({
  createdAt: at(day),
  closedAt: at(day),
  asset,
  realizedR,
});

test("cumulative R adds up in the order the account experienced", () => {
  const curve = buildRCurve([
    trade(3, -1),
    trade(1, 2),
    trade(2, 1),
  ]);

  assert.ok(curve);
  assert.deepEqual(
    curve.points.map((p) => p.cumulative),
    [2, 3, 2],
  );
  assert.deepEqual(
    curve.points.map((p) => p.n),
    [1, 2, 3],
  );
  assert.equal(curve.final, 2);
});

test("drawdown is measured from the running peak, not from zero", () => {
  // Climbs to +5, falls to +1, recovers to +6. The account was never below
  // zero, and it still spent 4R underwater relative to its own best.
  const curve = buildRCurve([
    trade(1, 3),
    trade(2, 2),
    trade(3, -2),
    trade(4, -2),
    trade(5, 5),
  ]);

  assert.ok(curve);
  assert.equal(curve.final, 6);
  assert.equal(curve.maxDrawdownR, 4);
});

test("two curves with the same total are told apart by the drawdown", () => {
  const smooth = buildRCurve([trade(1, 4), trade(2, 4)]);
  const brutal = buildRCurve([trade(1, -10), trade(2, 18)]);

  assert.equal(smooth?.final, brutal?.final);
  assert.equal(smooth?.maxDrawdownR, 0);
  assert.equal(brutal?.maxDrawdownR, 10);
});

test("zero is always inside the range", () => {
  const winning = buildRCurve([trade(1, 2), trade(2, 3)]);
  const losing = buildRCurve([trade(1, -2), trade(2, -3)]);

  // Without this a losing account draws as a gently rising line, because the
  // axis would start at its own worst value.
  assert.equal(winning?.min, 0);
  assert.equal(losing?.max, 0);
  assert.equal(losing?.min, -5);
});

test("trades with no R are left out entirely", () => {
  const curve = buildRCurve([
    trade(1, 1),
    trade(2, null),
    trade(3, 1),
    trade(4, null),
  ]);

  assert.equal(curve?.points.length, 2);
  assert.equal(curve?.final, 2);
});

test("fewer than two scored trades is not a curve", () => {
  assert.equal(buildRCurve([]), null);
  assert.equal(buildRCurve([trade(1, 3)]), null);
  assert.equal(buildRCurve([trade(1, 3), trade(2, null)]), null);
});

test("a trade with an R but no close time is ordered by when it opened", () => {
  const curve = buildRCurve([
    { createdAt: at(5), closedAt: null, asset: "XAUUSD", realizedR: 1 },
    { createdAt: at(1), closedAt: at(2), asset: "EURUSD", realizedR: -1 },
  ]);

  assert.deepEqual(
    curve?.points.map((p) => p.asset),
    ["EURUSD", "XAUUSD"],
  );
});

test("each point carries what the tooltip has to show", () => {
  const curve = buildRCurve([trade(1, 1.5, "XAUUSD"), trade(2, -0.5, "GBPUSD")]);
  const [first, second] = curve!.points;

  assert.equal(first.asset, "XAUUSD");
  assert.equal(first.r, 1.5);
  assert.equal(first.cumulative, 1.5);
  assert.equal(second.asset, "GBPUSD");
  assert.equal(second.cumulative, 1);
  assert.ok(second.at.startsWith("2026-07-02"));
});
