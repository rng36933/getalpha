import { auth } from "@clerk/nextjs/server";
import PageHeader from "@/components/PageHeader";
import PricingPlans, { type PlanCard } from "@/components/PricingPlans";
import { FREE_FEATURES, PAID_PLANS, PRO_FEATURES } from "@/lib/billing/plans";
import { isTestMode, sellingIsAllowed } from "@/lib/billing/paypal";
import { hasComplimentaryAccess } from "@/lib/billing/complimentary";
import { getSubscription } from "@/lib/billing/subscription";

/** Formats a plan amount for display, e.g. 19.99 -> "€19.99", 0 -> "€0". */
function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

/**
 * The plan cards for the pricing page.
 *
 * Amounts come straight from `plans.ts` — there is no PayPal object to read
 * them back from, so this file is the single source of truth for what gets
 * charged. See the docblock in `plans.ts`.
 */
function loadPlanCards(): PlanCard[] {
  const cards: PlanCard[] = PAID_PLANS.map((plan) => ({
    slug: plan.slug,
    name: plan.name,
    tagline: plan.tagline,
    highlight: plan.highlight,
    features: PRO_FEATURES,
    price: formatAmount(plan.amount),
    amount: plan.amount,
    interval: plan.interval,
    purchasable: true,
  }));

  const free: PlanCard = {
    slug: "free",
    name: "Free",
    tagline: "Everything except the AI modules.",
    price: "€0",
    amount: 0,
    interval: "month",
    features: FREE_FEATURES,
    purchasable: false,
  };

  return [free, ...cards];
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const { userId } = await auth();

  const plans = loadPlanCards();
  const subscription = userId ? await getSubscription(userId) : null;

  // A comped account has no subscription row, so without this the page would
  // invite somebody to pay for the two modules they already have.
  const complimentary = hasComplimentaryAccess(userId);

  return (
    <>
      <PageHeader title="Plans" subtitle="AI Session Brief and AI Coach are Pro. Everything else is free." />

      {complimentary ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-positive"
        >
          AI modules already unlocked on this account — nothing to pay.
        </p>
      ) : null}

      {checkout === "success" ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-positive"
        >
          Payment received. Access unlocks within seconds — reload if still locked.
        </p>
      ) : null}

      {checkout === "cancelled" ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted"
        >
          Checkout cancelled. Nothing was charged.
        </p>
      ) : null}

      {/* Two situations that used to share one banner.
          On the live site with sandbox settings nothing may be sold, the
          buttons are off, and no sandbox hint is printed — that would just be
          publishing the exploit. The hint appears only where it is useful and
          harmless: locally and on previews. */}
      {!sellingIsAllowed() ? (
        <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Not for sale yet — billing is not live. Nothing can be bought or charged.
        </p>
      ) : isTestMode() ? (
        <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Sandbox mode: use a PayPal sandbox buyer account to test checkout.
        </p>
      ) : null}

      <PricingPlans
        plans={plans}
        currentPlan={subscription?.planSlug ?? null}
        sellingClosed={!sellingIsAllowed()}
      />
    </>
  );
}
