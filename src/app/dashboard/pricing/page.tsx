import { auth } from "@clerk/nextjs/server";
import PageHeader from "@/components/PageHeader";
import PricingPlans, { type PlanCard } from "@/components/PricingPlans";
import { PAID_PLANS, priceIdFor } from "@/lib/billing/plans";
import { isTestMode, sellingIsAllowed, stripe } from "@/lib/billing/stripe";
import { hasComplimentaryAccess } from "@/lib/billing/complimentary";
import { getSubscription } from "@/lib/billing/subscription";
import { pricingCopy, type PricingCopy } from "@/lib/i18n/app/pricing";
import { getLocale } from "@/lib/i18n/server";

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
async function loadPlanCards(copy: PricingCopy): Promise<PlanCard[]> {
  const cards = await Promise.all(
    PAID_PLANS.map(async (plan): Promise<PlanCard> => {
      const base = {
        slug: plan.slug,
        name: copy.pro.name,
        tagline:
          plan.slug === "pro-yearly" ? copy.pro.yearlyTagline : copy.pro.monthlyTagline,
        highlight: plan.highlight ? copy.pro.bestValue : undefined,
        features: copy.pro.features,
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
    name: copy.free.name,
    tagline: copy.free.tagline,
    price: "€0",
    interval: "month",
    features: copy.free.features,
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
  const locale = await getLocale();
  const copy = pricingCopy(locale);

  const [plans, subscription] = await Promise.all([
    loadPlanCards(copy),
    userId ? getSubscription(userId) : Promise.resolve(null),
  ]);

  // A comped account has no subscription row, so without this the page would
  // invite somebody to pay for the two modules they already have.
  const complimentary = hasComplimentaryAccess(userId);

  return (
    <>
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      {complimentary ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-positive"
        >
          {copy.complimentaryNotice}
        </p>
      ) : null}

      {checkout === "success" ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-positive"
        >
          {copy.checkoutSuccessNotice}
        </p>
      ) : null}

      {checkout === "cancelled" ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted"
        >
          {copy.checkoutCancelledNotice}
        </p>
      ) : null}

      {/* Two situations that used to share one banner.
          On the live site with test keys nothing may be sold, the buttons are
          off, and the test card number is deliberately not printed — publishing
          it to every signed-in visitor is handing out the exploit. The hint
          appears only where it is useful and harmless: locally and on previews. */}
      {!sellingIsAllowed() ? (
        <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          {copy.sellingClosedNotice}
        </p>
      ) : isTestMode() ? (
        <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          {copy.testModeNotice}
        </p>
      ) : null}

      <PricingPlans
        plans={plans}
        currentPlan={subscription?.planSlug ?? null}
        sellingClosed={!sellingIsAllowed()}
        locale={locale}
      />
    </>
  );
}
