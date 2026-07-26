import { auth } from "@clerk/nextjs/server";
import PageHeader from "@/components/PageHeader";
import PricingPlans, { type PlanCard } from "@/components/PricingPlans";
import {
  FREE_FEATURES,
  PAID_PLANS,
  PRO_FEATURES,
  priceIdFor,
} from "@/lib/billing/plans";
import { isTestMode, sellingIsAllowed, stripe } from "@/lib/billing/stripe";
import { hasComplimentaryAccess } from "@/lib/billing/complimentary";
import { getSubscription } from "@/lib/billing/subscription";

/**
 * Formats a Stripe price for display.
 *
 * Amounts are minor units — 1900 is €19.00 — and the trailing ".00" is dropped
 * because a round price reads better without it.
 */
function formatAmount(amount: number | null, currency: string): string | null {
  if (amount === null) return null;

  const value = amount / 100;
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

/**
 * Reads the live price for each plan from Stripe.
 *
 * The amount is not stored in the codebase on purpose: whatever this page
 * claims, Checkout charges what Stripe holds, and two sources of truth for a
 * price is the kind of mismatch that ends in a refund. Changing what you charge
 * is a Stripe dashboard edit, not a deploy.
 */
async function loadPlanCards(): Promise<PlanCard[]> {
  const cards = await Promise.all(
    PAID_PLANS.map(async (plan): Promise<PlanCard> => {
      const base = {
        slug: plan.slug,
        name: plan.name,
        tagline: plan.tagline,
        highlight: plan.highlight,
        features: PRO_FEATURES,
      };

      const priceId = priceIdFor(plan);
      if (!priceId) {
        return { ...base, price: null, interval: null, purchasable: false };
      }

      try {
        const price = await stripe().prices.retrieve(priceId);

        return {
          ...base,
          price: formatAmount(price.unit_amount, price.currency),
          interval: price.recurring?.interval ?? null,
          purchasable: price.active,
        };
      } catch (error) {
        // A price that cannot be read is not a page that should fail: show the
        // plan without a number rather than a stack trace.
        console.error(`Could not read the Stripe price ${priceId}:`, error);
        return { ...base, price: null, interval: null, purchasable: false };
      }
    }),
  );

  const free: PlanCard = {
    slug: "free",
    name: "Free",
    tagline: "Everything except the AI modules.",
    price: "€0",
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

  const [plans, subscription] = await Promise.all([
    loadPlanCards(),
    userId ? getSubscription(userId) : Promise.resolve(null),
  ]);

  // A comped account has no subscription row, so without this the page would
  // invite somebody to pay for the two modules they already have.
  const complimentary = hasComplimentaryAccess(userId);

  return (
    <>
      <PageHeader
        title="Plans"
        subtitle="The AI Session Brief and AI Coach are the paid modules. Everything else is free."
      />

      {complimentary ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-positive"
        >
          The AI Session Brief and AI Coach are already unlocked on this account.
          There is nothing to pay and nothing to subscribe to — ignore the plans
          below.
        </p>
      ) : null}

      {checkout === "success" ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-positive"
        >
          Payment received. Access is granted as soon as Stripe confirms it —
          usually a second or two. Reload if the AI modules are still locked.
        </p>
      ) : null}

      {checkout === "cancelled" ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted"
        >
          Checkout was cancelled. Nothing was charged.
        </p>
      ) : null}

      {/* Two situations that used to share one banner.
          On the live site with test keys nothing may be sold, the buttons are
          off, and the test card number is deliberately not printed — publishing
          it to every signed-in visitor is handing out the exploit. The hint
          appears only where it is useful and harmless: locally and on previews. */}
      {!sellingIsAllowed() ? (
        <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Payments are not open yet. Pro is not for sale on this site until
          billing goes live — nothing here can be bought, and nothing will be
          charged.
        </p>
      ) : isTestMode() ? (
        <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Stripe is in test mode. Use card 4242 4242 4242 4242 with any future
          expiry and any CVC — no real money moves.
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
