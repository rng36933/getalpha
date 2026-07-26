import assert from "node:assert/strict";
import test from "node:test";
import {
  isProductionDeployment,
  isTestMode,
  sellingIsAllowed,
} from "../src/lib/billing/mode.ts";

const TEST_KEY = "sk_test_abc123";
const LIVE_KEY = "sk_live_abc123";

test("test keys on the live deployment cannot sell", () => {
  // The whole point. Stripe's test cards are published, so a test-mode
  // checkout on the live site is a free subscription for anyone who tries one.
  assert.equal(sellingIsAllowed(TEST_KEY, "production"), false);
});

test("live keys on the live deployment can sell", () => {
  assert.equal(sellingIsAllowed(LIVE_KEY, "production"), true);
});

test("test keys are fine anywhere that is not the live deployment", () => {
  // Local development and preview deployments are exactly where test keys
  // belong, and the guard must not break them.
  assert.equal(sellingIsAllowed(TEST_KEY, "preview"), true);
  assert.equal(sellingIsAllowed(TEST_KEY, "development"), true);
  assert.equal(sellingIsAllowed(TEST_KEY, undefined), true);
});

test("a missing secret key does not read as live", () => {
  // Unset is not `sk_test_`, so selling is technically allowed — but nothing
  // can be sold without a key anyway, and the checkout route answers 503 on
  // BillingConfigError. What must never happen is the opposite: an unset key
  // being treated as a valid live one.
  assert.equal(isTestMode(undefined), false);
  assert.equal(isTestMode(""), false);
});

test("only VERCEL_ENV=production counts as the live deployment", () => {
  assert.equal(isProductionDeployment("production"), true);
  assert.equal(isProductionDeployment("preview"), false);
  assert.equal(isProductionDeployment(undefined), false);
  // Not a substring match: a value like "not-production" is not production.
  assert.equal(isProductionDeployment("not-production"), false);
});
