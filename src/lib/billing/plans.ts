/**
 * The plan catalogue.
 *
 * Prices live in Stripe, not here: only the price *id* is configured, and the
 * amount shown on the pricing page is read back from Stripe at render time.
 * A hardcoded "€19" is a promise the checkout page is free to break, and
 * changing what you charge should not need a deploy.
 */

export type PlanSlug = "free" | "pro-monthly" | "pro-yearly";

export type PaidPlan = {
  slug: Exclude<PlanSlug, "free">;
  name: string;
  /** Environment variable holding the Stripe price id. */
  priceEnv: string;
  tagline: string;
  /** Shown as a badge. Only one plan should carry it. */
  highlight?: string;
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
    priceEnv: "STRIPE_PRICE_PRO_MONTHLY",
    tagline: "Billed monthly, cancel any time.",
  },
  {
    slug: "pro-yearly",
    name: "Pro",
    priceEnv: "STRIPE_PRICE_PRO_YEARLY",
    tagline: "Billed once a year.",
    highlight: "Best value",
  },
];

export function findPlan(slug: string): PaidPlan | undefined {
  return PAID_PLANS.find((plan) => plan.slug === slug);
}

/** The configured Stripe price id for a plan, or null when it is not set up. */
export function priceIdFor(plan: PaidPlan): string | null {
  return process.env[plan.priceEnv] || null;
}

/**
 * Maps a Stripe price id back onto a plan slug.
 *
 * The webhook needs this: Stripe reports the price that was bought, and the
 * subscription row records the plan, so a user who switches plans in Stripe's
 * portal ends up on the right one without checkout being involved.
 */
export function planSlugForPrice(priceId: string | null | undefined): PlanSlug | null {
  if (!priceId) return null;

  const match = PAID_PLANS.find((plan) => priceIdFor(plan) === priceId);
  return match ? match.slug : null;
}
