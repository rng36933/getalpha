"use client";

import { useState } from "react";
import { pricingCopy } from "@/lib/i18n/app/pricing";
import type { Locale } from "@/lib/i18n/locales";

export type PlanCard = {
  slug: string;
  name: string;
  tagline: string;
  highlight?: string;
  /** Formatted by the server from the live Stripe price, e.g. "€19". */
  price: string | null;
  /** "month" | "year", or null when the price could not be read. */
  interval: string | null;
  features: readonly string[];
  /** False when the plan has no Stripe price configured yet. */
  purchasable: boolean;
};

type PricingPlansProps = {
  plans: PlanCard[];
  /** Slug the user is already on, so their current plan is not offered again. */
  currentPlan: string | null;
  /**
   * Billing is not open on this deployment, so nothing may be bought.
   *
   * The server refuses the checkout call regardless — this only stops the page
   * offering a button that cannot work. The guard that matters is the one in
   * the route, because a disabled button is a suggestion, not a control.
   */
  sellingClosed?: boolean;
  locale: Locale;
};

export default function PricingPlans({
  plans,
  currentPlan,
  sellingClosed = false,
  locale,
}: PricingPlansProps) {
  const copy = pricingCopy(locale);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(slug: string) {
    setPending(slug);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: slug }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.url) {
        setError(body?.error ?? copy.checkoutFailed);
        setPending(null);
        return;
      }

      // Stripe hosts the payment page; card details never touch this app.
      // `assign` rather than setting `location.href`, which the React Compiler
      // lint reads as mutating a value defined outside the component.
      window.location.assign(body.url);
    } catch {
      setError(copy.networkError);
      setPending(null);
    }
  }

  return (
    <div>
      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-negative/30 bg-negative/10 px-4 py-3 text-sm text-negative"
        >
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.slug === currentPlan;

          return (
            <section
              key={plan.slug}
              className={`surface-lit flex flex-col rounded-xl border p-5 ${
                plan.highlight ? "glow-ai border-accent/40" : "border-line"
              }`}
            >
              <header className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-medium">{plan.name}</h2>
                {plan.highlight ? (
                  <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                    {plan.highlight}
                  </span>
                ) : null}
              </header>

              <p className="figure mt-4 text-2xl">
                {plan.price ?? "—"}
                {plan.interval ? (
                  <span className="text-sm font-normal text-muted">
                    {" "}
                    {copy.perInterval(plan.interval)}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-xs text-muted">{plan.tagline}</p>

              <ul className="mt-4 flex-1 space-y-2 text-sm text-muted">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span aria-hidden="true" className="text-accent">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.slug === "free" ? null : (
                <button
                  type="button"
                  onClick={() => subscribe(plan.slug)}
                  disabled={
                    sellingClosed ||
                    !plan.purchasable ||
                    isCurrent ||
                    pending !== null
                  }
                  className="mt-5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-muted"
                >
                  {isCurrent
                    ? copy.currentPlan
                    : sellingClosed
                      ? copy.notForSaleYet
                      : !plan.purchasable
                        ? copy.notAvailableYet
                        : pending === plan.slug
                          ? copy.openingCheckout
                          : copy.subscribe}
                </button>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
