import assert from "node:assert/strict";
import test from "node:test";
import { PAID_PLANS, findPlan } from "../src/lib/billing/plans.ts";

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
  // 'free' is a plan tier but it is not something PayPal charges for, so it is
  // absent from PAID_PLANS. findPlan("free") must not accidentally match it.
  assert.equal(findPlan("free"), undefined);
  assert.equal(findPlan(""), undefined);
  assert.equal(findPlan("pro-quarterly"), undefined);
});

test("free is not in PAID_PLANS", () => {
  // The free tier has features listed for the pricing page, but it has no
  // amount and must never appear where a charge would be created.
  // Cast to string to avoid TS narrowing the union to never.
  assert.equal(PAID_PLANS.find((p) => (p.slug as string) === "free"), undefined);
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

test("every plan has a positive amount", () => {
  // A zero or negative amount would either give Pro away for free or fail at
  // PayPal's checkout with a confusing error far from the actual mistake.
  for (const plan of PAID_PLANS) {
    assert.ok(plan.amount > 0, `${plan.slug} has a non-positive amount`);
  }
});

test("intervalUnit matches interval", () => {
  // These two fields are set independently in the same object literal — this
  // guards against them drifting apart (e.g. "M" paired with "year").
  const expected: Record<string, string> = { M: "month", Y: "year" };
  for (const plan of PAID_PLANS) {
    assert.equal(expected[plan.intervalUnit], plan.interval);
  }
});
