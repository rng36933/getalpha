import type { PaidPlan } from "./plans";

/** Identifies this specific promotion in the checkout request body. */
export const PROMO_CODE = "2x1";

/**
 * When the 2-for-1 promo stops being honoured.
 *
 * Fixed in code rather than an env var: a promo with an end date that could
 * be silently extended by changing a Vercel setting is not actually a
 * deadline. Announced 2026-09-28, runs 14 days.
 */
const PROMO_DEADLINE = new Date("2026-10-13T00:00:00+03:00");

export function promoActive(now: Date = new Date()): boolean {
  return now.getTime() < PROMO_DEADLINE.getTime();
}

/**
 * PayPal classic subscribe buttons support a trial billing cycle (`a1`/`p1`/
 * `t1`) ahead of the regular one (`a3`/`p3`/`t3`). Setting the trial to one
 * full cycle at €0.00 gives exactly "buy one, get one": the first period is
 * free, then the normal recurring charge takes over unchanged.
 */
export function promoTrialFields(plan: PaidPlan): Record<string, string> {
  return {
    a1: "0.00",
    p1: "1",
    t1: plan.intervalUnit,
  };
}
