import assert from "node:assert/strict";
import test from "node:test";
import {
  PAID_PLANS,
  findPlan,
  planSlugForPrice,
  priceIdFor,
} from "../src/lib/billing/plans.ts";

test("findPlan returns the monthly plan by slug", () => {
  const plan = findPlan("pro-monthly");
  assert.ok(plan);
  assert.equal(plan.slug, "pro-monthly");
  assert.equal(plan.name, "Pro");
  assert.ok(plan.tagline.length > 0);
});

test("findPlan returns the yearly plan by slug", () => {
  const plan = findPlan("pro-yearly");
  assert.ok(plan);
  assert.equal(plan.slug, "pro-yearly");
});

test("findPlan returns undefined for unknown slugs", () => {
  // 'free' is a plan tier but it is not a Stripe product, so it is absent from
  // PAID_PLANS. findPlan("free") must not accidentally match something.
  assert.equal(findPlan("free"), undefined);
  assert.equal(findPlan(""), undefined);
  assert.equal(findPlan("pro-quarterly"), undefined);
});

test("free is not in PAID_PLANS", () => {
  // The free tier has features listed for the pricing page, but it has no
  // Stripe price id and must never appear where a charge would be created.
  assert.equal(PAID_PLANS.find((p) => p.slug === "free"), undefined);
});

test("at most one plan carries the highlight badge", () => {
  // Two 'Best value' badges side by side look like a layout bug and confuse
  // which plan is being recommended.
  const highlighted = PAID_PLANS.filter((p) => p.highlight !== undefined);
  assert.ok(
    highlighted.length <= 1,
    `${highlighted.length} plans carry a highlight badge — at most one should`,
  );
});

test("every plan slug is unique", () => {
  const slugs = PAID_PLANS.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length, "plan slugs must be unique");
});

test("every plan reads its price id from a different env variable", () => {
  // Two plans pointing at the same variable would silently swap their prices
  // after a misconfiguration, and checkout would charge the wrong amount.
  const envs = PAID_PLANS.map((p) => p.priceEnv);
  assert.equal(
    new Set(envs).size,
    envs.length,
    "each plan must name a distinct priceEnv",
  );
});

test("planSlugForPrice returns null for falsy input", () => {
  assert.equal(planSlugForPrice(null), null);
  assert.equal(planSlugForPrice(undefined), null);
  assert.equal(planSlugForPrice(""), null);
});

test("planSlugForPrice returns null when no env vars are configured", () => {
  // With no price ids set, no incoming Stripe price can match — the function
  // must not return a stale match from a previous state of the environment.
  const saved = {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  };
  delete process.env.STRIPE_PRICE_PRO_MONTHLY;
  delete process.env.STRIPE_PRICE_PRO_YEARLY;

  try {
    assert.equal(planSlugForPrice("price_any_id"), null);
  } finally {
    if (saved.monthly !== undefined)
      process.env.STRIPE_PRICE_PRO_MONTHLY = saved.monthly;
    if (saved.yearly !== undefined)
      process.env.STRIPE_PRICE_PRO_YEARLY = saved.yearly;
  }
});

test("planSlugForPrice round-trips through priceIdFor", () => {
  // The Stripe webhook delivers a price id and the app must map it back to a
  // plan slug to write the right row. A wrong slug here means a subscriber is
  // shown as being on the wrong plan in every part of the UI.
  const saved = {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  };

  process.env.STRIPE_PRICE_PRO_MONTHLY = "price_test_monthly_001";
  process.env.STRIPE_PRICE_PRO_YEARLY = "price_test_yearly_002";

  try {
    assert.equal(planSlugForPrice("price_test_monthly_001"), "pro-monthly");
    assert.equal(planSlugForPrice("price_test_yearly_002"), "pro-yearly");
    // A price id that does not belong to any configured plan returns null.
    assert.equal(planSlugForPrice("price_unknown_999"), null);
  } finally {
    if (saved.monthly !== undefined) {
      process.env.STRIPE_PRICE_PRO_MONTHLY = saved.monthly;
    } else {
      delete process.env.STRIPE_PRICE_PRO_MONTHLY;
    }
    if (saved.yearly !== undefined) {
      process.env.STRIPE_PRICE_PRO_YEARLY = saved.yearly;
    } else {
      delete process.env.STRIPE_PRICE_PRO_YEARLY;
    }
  }
});

test("priceIdFor returns null when the env var is absent", () => {
  const plan = PAID_PLANS.find((p) => p.slug === "pro-monthly")!;
  const saved = process.env[plan.priceEnv];
  delete process.env[plan.priceEnv];

  try {
    assert.equal(priceIdFor(plan), null);
  } finally {
    if (saved !== undefined) process.env[plan.priceEnv] = saved;
  }
});

test("priceIdFor returns the configured price id", () => {
  const plan = PAID_PLANS.find((p) => p.slug === "pro-monthly")!;
  const saved = process.env[plan.priceEnv];
  process.env[plan.priceEnv] = "price_configured_test";

  try {
    assert.equal(priceIdFor(plan), "price_configured_test");
  } finally {
    if (saved !== undefined) {
      process.env[plan.priceEnv] = saved;
    } else {
      delete process.env[plan.priceEnv];
    }
  }
});
