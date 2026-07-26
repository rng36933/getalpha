import assert from "node:assert/strict";
import test from "node:test";
import { buildRDistribution } from "../src/lib/dashboard/r-distribution.ts";

const binAt = (d: ReturnType<typeof buildRDistribution>, from: number) =>
  d?.bins.find((b) => b.from === from);

test("every trade lands in exactly one bin", () => {
  const rs = [-3, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 4];
  const d = buildRDistribution(rs);

  assert.ok(d);
  assert.equal(d.scored, rs.length);
  assert.equal(
    d.bins.reduce((sum, bin) => sum + bin.count, 0),
    rs.length,
  );
});

test("bin edges are lower-inclusive so nothing double-counts", () => {
  const d = buildRDistribution([-1, -0.5, 0, 1, 2]);

  assert.equal(binAt(d, -1)?.count, 1);
  assert.equal(binAt(d, -0.5)?.count, 1);
  assert.equal(binAt(d, 0)?.count, 1);
  assert.equal(binAt(d, 1)?.count, 1);
  // +2 belongs to the open top bin, not to the 1.5–2 one.
  assert.equal(binAt(d, 1.5)?.count, 0);
  assert.equal(d?.bins.at(-1)?.count, 1);
});

test("the tails are open, so a disaster stays on the chart", () => {
  const d = buildRDistribution([-9, -4, 7]);

  assert.equal(d?.bins[0].count, 2);
  assert.equal(d?.bins[0].label, "≤ −2");
  assert.equal(d?.bins.at(-1)?.count, 1);
});

test("a stop doing its job is not counted as a stop that failed", () => {
  // Exactly −1 is the stop working. −1.4 is not.
  const d = buildRDistribution([-1, -1, -1.4, -2.5, 1]);

  assert.equal(d?.withinPlan, 2);
  assert.equal(d?.worseThanPlanned, 2);
});

test("a scratch counts on the win side, not the loss side", () => {
  const d = buildRDistribution([0]);

  assert.equal(binAt(d, 0)?.sign, "WIN");
  assert.equal(d?.withinPlan, 0);
  assert.equal(d?.worseThanPlanned, 0);
});

test("the same expectancy, two different accounts", () => {
  // Both average +0.2R. One honours its stops; the other does not.
  const disciplined = buildRDistribution([-1, -1, 1, 1, 1]);
  const reckless = buildRDistribution([-4, -1, 1, 1, 4]);

  const mean = (rs: number[]) => rs.reduce((a, b) => a + b, 0) / rs.length;
  assert.equal(mean([-1, -1, 1, 1, 1]), mean([-4, -1, 1, 1, 4]));

  assert.equal(disciplined?.worseThanPlanned, 0);
  assert.equal(reckless?.worseThanPlanned, 1);
});

test("percentages are of the scored trades", () => {
  const d = buildRDistribution([-1, -1, 1, 1]);

  assert.equal(binAt(d, -1)?.percent, 50);
  assert.equal(binAt(d, 1)?.percent, 50);
});

test("only whole R values are labelled, so the axis stays readable", () => {
  const d = buildRDistribution([1]);
  const labelled = d?.bins.filter((bin) => bin.label !== "").length;

  // −2, −1, 0, +1 and the two open ends.
  assert.equal(labelled, 6);
  assert.equal(binAt(d, -0.5)?.label, "");
});

test("nothing scored is not a distribution", () => {
  assert.equal(buildRDistribution([]), null);
  assert.equal(buildRDistribution([Number.NaN]), null);
});
