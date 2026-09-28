import assert from "node:assert/strict";
import test from "node:test";
import {
  isProductionDeployment,
  isTestMode,
  sellingIsAllowed,
} from "../src/lib/billing/mode.ts";

test("sandbox credentials on the live deployment cannot sell", () => {
  // The whole point. PayPal sandbox buyer accounts are free to complete an
  // approval flow, so a sandbox checkout on the live site is a free
  // subscription for anyone who tries one.
  assert.equal(sellingIsAllowed("sandbox", "production"), false);
});

test("live credentials on the live deployment can sell", () => {
  assert.equal(sellingIsAllowed("live", "production"), true);
});

test("sandbox credentials are fine anywhere that is not the live deployment", () => {
  // Local development and preview deployments are exactly where sandbox
  // credentials belong, and the guard must not break them.
  assert.equal(sellingIsAllowed("sandbox", "preview"), true);
  assert.equal(sellingIsAllowed("sandbox", "development"), true);
  assert.equal(sellingIsAllowed("sandbox", undefined), true);
});

test("an unset PAYPAL_ENV reads as sandbox, not live", () => {
  // What must never happen is the opposite: an unset env var being treated as
  // a valid live one and quietly allowing real charges.
  assert.equal(isTestMode(undefined), true);
  assert.equal(isTestMode(""), true);
});

test("only VERCEL_ENV=production counts as the live deployment", () => {
  assert.equal(isProductionDeployment("production"), true);
  assert.equal(isProductionDeployment("preview"), false);
  assert.equal(isProductionDeployment(undefined), false);
  // Not a substring match: a value like "not-production" is not production.
  assert.equal(isProductionDeployment("not-production"), false);
});
