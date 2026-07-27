import assert from "node:assert/strict";
import test from "node:test";
import { ltCount, ltPlural } from "../src/lib/i18n/plural.ts";

const candle = (n: number) => ltPlural(n, "žvakė", "žvakės", "žvakių");

test("ends in one, takes the singular", () => {
  assert.equal(candle(1), "žvakė");
  assert.equal(candle(21), "žvakė");
  assert.equal(candle(101), "žvakė");
});

test("ends in two through nine, takes the plural", () => {
  assert.equal(candle(2), "žvakės");
  assert.equal(candle(5), "žvakės");
  assert.equal(candle(9), "žvakės");
  assert.equal(candle(23), "žvakės");
});

test("the teens are the exception and take the genitive", () => {
  // The whole reason this cannot be a check on the last digit alone: 11 ends
  // in 1 and 12 ends in 2, and both take the third form.
  assert.equal(candle(11), "žvakių");
  assert.equal(candle(12), "žvakių");
  assert.equal(candle(19), "žvakių");
});

test("zero and the tens take the genitive", () => {
  assert.equal(candle(0), "žvakių");
  assert.equal(candle(10), "žvakių");
  assert.equal(candle(20), "žvakių");
  assert.equal(candle(100), "žvakių");
});

test("the numbers this page actually produces", () => {
  // The intraday reading counts twelve bars and the average counts twenty —
  // both land in the genitive, which is the form a naive translation gets
  // wrong because English has no equivalent.
  assert.equal(ltCount(12, "žvakė", "žvakės", "žvakių"), "12 žvakių");
  assert.equal(ltCount(20, "žvakė", "žvakės", "žvakių"), "20 žvakių");
  // The agreement line counts readings, never more than five.
  assert.equal(ltCount(1, "rodiklis", "rodikliai", "rodiklių"), "1 rodiklis");
  assert.equal(ltCount(5, "rodiklis", "rodikliai", "rodiklių"), "5 rodikliai");
});

test("a negative or fractional count does not break the rule", () => {
  assert.equal(candle(-3), "žvakės");
  assert.equal(candle(4.7), "žvakės");
});
