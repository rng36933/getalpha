import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_DAILY_BUDGET_USD,
  DEFAULT_PER_USER_BUDGET_USD,
  isPerUserCapped,
  readBudgetUsd,
} from "../src/lib/ai/budget-limits.ts";

test("an unset or blank value falls back", () => {
  assert.equal(readBudgetUsd(undefined, 2, "X"), 2);
  assert.equal(readBudgetUsd("", 2, "X"), 2);
  assert.equal(readBudgetUsd("   ", 2, "X"), 2);
});

test("a valid amount is read, decimals included", () => {
  assert.equal(readBudgetUsd("10", 2, "X"), 10);
  assert.equal(readBudgetUsd("0.5", 2, "X"), 0.5);
  // Zero is a legitimate setting: it turns the AI modules off.
  assert.equal(readBudgetUsd("0", 2, "X"), 0);
});

test("a malformed amount falls back rather than becoming zero", () => {
  // Zero would read as "refuse every call", which is a very confusing way for a
  // typo in an env var to present itself.
  assert.equal(readBudgetUsd("two dollars", 2, "X"), 2);
  assert.equal(readBudgetUsd("-5", 2, "X"), 2);
  assert.equal(readBudgetUsd("NaN", 2, "X"), 2);
  assert.equal(readBudgetUsd("Infinity", 2, "X"), 2);
});

test("the per-account ceiling sits below a Pro subscription's daily revenue", () => {
  // €19.99/month is about $0.72 a day. A user parked at the ceiling every day
  // has to stay cheaper than that or the plan loses money on its best customer.
  const proRevenuePerDay = 21.6 / 30;

  assert.ok(DEFAULT_PER_USER_BUDGET_USD < proRevenuePerDay);
  // And it has to be worth having: several reviews a day at about $0.09 each.
  assert.ok(DEFAULT_PER_USER_BUDGET_USD / 0.09 >= 5);
});

test("the per-account ceiling is well under the application's", () => {
  assert.ok(DEFAULT_PER_USER_BUDGET_USD < DEFAULT_DAILY_BUDGET_USD);
});

test("only the Coach is charged to one account", () => {
  assert.equal(isPerUserCapped("TRADE_COACH"), true);
  // The brief is one shared document on a four-hour cache. Billing it to
  // whoever opened the page first would charge one person for everybody's
  // reading and lock out the first visitor of each window.
  assert.equal(isPerUserCapped("SESSION_BRIEF"), false);
  assert.equal(isPerUserCapped("SOMETHING_NEW"), false);
});
