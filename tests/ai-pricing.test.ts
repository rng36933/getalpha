import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PER_USER_BUDGET_USD } from "../src/lib/ai/budget-limits.ts";
import {
  COACH_RESERVE_TOKENS,
  costOfUsage,
  isKnownModel,
  worstCaseCost,
} from "../src/lib/ai/pricing.ts";

const usage = (o: Record<string, unknown>) => ({
  inputTokens: 0,
  outputTokens: 0,
  cacheCreationInputTokens: 0,
  cacheReadInputTokens: 0,
  model: "claude-opus-5",
  ...o,
});

test("opus 5 input and output are billed at 5 and 25 per MTok", () => {
  const cost = costOfUsage(usage({ inputTokens: 1000, outputTokens: 500 }));
  // 1000 * 5/1e6 = 0.005, 500 * 25/1e6 = 0.0125
  assert.equal(cost, 0.0175);
});

test("cache writes cost 1.25x and cache reads 0.1x of base input", () => {
  const write = costOfUsage(usage({ cacheCreationInputTokens: 100_000 }));
  const read = costOfUsage(usage({ cacheReadInputTokens: 100_000 }));

  assert.equal(write, 0.625); // 100k * 5/1e6 * 1.25
  assert.equal(read, 0.05); // 100k * 5/1e6 * 0.1
  // Reading a cached prefix is 12.5x cheaper than writing it.
  assert.equal(Math.round(write / read), 13);
});

test("a full request adds all four components", () => {
  const cost = costOfUsage(
    usage({
      inputTokens: 1000,
      outputTokens: 500,
      cacheCreationInputTokens: 2000,
      cacheReadInputTokens: 4000,
    }),
  );

  assert.equal(Number(cost.toFixed(6)), 0.032);
});

test("an unknown model is billed at the most expensive known rate", () => {
  assert.equal(isKnownModel("claude-something-new"), false);

  const cost = costOfUsage(
    usage({ model: "claude-something-new", inputTokens: 1000, outputTokens: 1000 }),
  );

  // 10 and 50 per MTok, not 5 and 25 — an unknown model must never look cheap.
  assert.equal(cost, 0.06);
});

test("a fallback response is billed at the model that actually served it", () => {
  const opus5 = costOfUsage(usage({ model: "claude-opus-5", outputTokens: 1000 }));
  const haiku = costOfUsage(usage({ model: "claude-haiku-4-5", outputTokens: 1000 }));

  assert.equal(opus5, 0.025);
  assert.equal(haiku, 0.005);
});

test("worst case reserves the whole output budget", () => {
  assert.equal(worstCaseCost("claude-opus-5", 16_000), 0.4);
  assert.equal(worstCaseCost("claude-opus-5", 8_000), 0.2);
  // The coach at 16k output could alone consume 20% of a $2 daily budget.
  assert.ok(worstCaseCost("claude-opus-5", 16_000) / 2 === 0.2);
});

/**
 * The bug this guards against: reserving the Coach's full `maxTokens` (16,000,
 * a truncation ceiling sized for the longest plausible response) against the
 * per-account daily cap meant that two *completed*, cheaply-settled reviews
 * plus one more worst-case reservation was already enough to clear
 * `DEFAULT_PER_USER_BUDGET_USD` — a comment in budget-limits.ts promised five
 * or six reviews a day, and the reservation math actually delivered two.
 *
 * Imports the real `COACH_RESERVE_TOKENS` `coach.ts` uses, rather than a copy
 * of the number, so this test fails the moment the two could drift apart
 * instead of silently testing a value nothing reads any more.
 */
test("the per-account budget delivers roughly the reviews per day it promises", () => {
  const reserve = worstCaseCost("claude-opus-5", COACH_RESERVE_TOKENS);
  // The measured average from a real review (AiUsageLog: 742 in / 2664 out).
  const measuredRealCost = 0.09;

  let spent = 0;
  let completed = 0;

  // Simulates reserveBudget's gate: a call is allowed only while the
  // reservation fits under the ceiling alongside what has already settled.
  while (spent + reserve <= DEFAULT_PER_USER_BUDGET_USD) {
    spent += measuredRealCost;
    completed += 1;
  }

  assert.ok(
    completed >= 5,
    `only ${completed} reviews fit before the gate blocks a sixth — the budget comment promises five or six`,
  );
});
