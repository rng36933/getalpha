/**
 * The plan catalogue.
 *
 * Amounts are set here, not read back from a PayPal dashboard object: classic
 * PayPal subscribe buttons have no server-side "plan" to look up, only fields
 * supplied at checkout time. The trade-off for "just an email address, no API
 * app" is that this file is the one place a price change actually happens.
 */

export type PlanSlug = "free" | "pro-monthly" | "pro-yearly";

export type PaidPlan = {
  slug: Exclude<PlanSlug, "free">;
  name: string;
  tagline: string;
  /** Shown as a badge. Only one plan should carry it. */
  highlight?: string;
  /** Euros, charged at this amount every billing cycle. */
  amount: number;
  /** PayPal's billing-cycle unit code for this plan. */
  intervalUnit: "M" | "Y";
  /** Human-readable cadence, matching `intervalUnit`. */
  interval: "month" | "year";
};

/** What the free tier gets. Listed so the pricing page can be honest about it. */
export const FREE_FEATURES = [
  "Trade journal with computed P&L, risk and planned reward-to-risk",
  "Live price charts for your watchlist",
  "Economic calendar",
] as const;

/** What paying adds. These are the AI features — the ones that cost money to run. */
export const PRO_FEATURES = [
  "AI Session Brief before every session",
  "AI Coach process review on any trade",
  "Everything in Free",
] as const;

export const PAID_PLANS: PaidPlan[] = [
  {
    slug: "pro-monthly",
    name: "Pro",
    tagline: "Billed monthly, cancel any time.",
    amount: 19.99,
    intervalUnit: "M",
    interval: "month",
  },
  {
    slug: "pro-yearly",
    name: "Pro",
    tagline: "Billed once a year.",
    highlight: "Best value",
    amount: 199.99,
    intervalUnit: "Y",
    interval: "year",
  },
];

export function findPlan(slug: string): PaidPlan | undefined {
  return PAID_PLANS.find((plan) => plan.slug === slug);
}
