import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_DAILY_BUDGET_USD,
  DEFAULT_HIGH_PER_USER_BUDGET_USD,
  DEFAULT_PER_USER_BUDGET_USD,
  highBudgetUserIds,
  isPerUserCapped,
  perUserDailyBudgetUsd,
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

test("highBudgetUserIds parses the same shape as PRO_USER_IDS", () => {
  assert.deepEqual(highBudgetUserIds("user_a, user_b ,, user_c"), [
    "user_a",
    "user_b",
    "user_c",
  ]);
  assert.deepEqual(highBudgetUserIds(undefined), []);
  assert.deepEqual(highBudgetUserIds(""), []);
});

test("nobody is raised without an explicit userId", () => {
  // Every existing call site that predates this override passes no id, and
  // must keep getting the ordinary cap rather than silently gaining a higher
  // one because some unrelated env var happens to be set.
  assert.equal(perUserDailyBudgetUsd(), DEFAULT_PER_USER_BUDGET_USD);
  assert.equal(perUserDailyBudgetUsd(null), DEFAULT_PER_USER_BUDGET_USD);
});

test("an id outside the list still gets the ordinary cap", () => {
  assert.equal(perUserDailyBudgetUsd("user_not_listed"), DEFAULT_PER_USER_BUDGET_USD);
});

test("the raised cap is well above the ordinary one but still a number, not infinity", () => {
  // Bounded, because this is for the operator testing the product, not a
  // second unmetered plan quietly available to anyone whose id gets added to
  // the list for an unrelated reason. It is not compared against
  // DEFAULT_DAILY_BUDGET_USD here — that comparison depends on the
  // *application-wide* cap actually configured in the deployment, which this
  // module knows nothing about, and a passing unit test must not imply that
  // relationship holds in production when it is really an operator's env-var
  // decision on the day.
  assert.ok(DEFAULT_HIGH_PER_USER_BUDGET_USD > DEFAULT_PER_USER_BUDGET_USD);
  assert.ok(Number.isFinite(DEFAULT_HIGH_PER_USER_BUDGET_USD));
});
