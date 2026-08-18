"use client";

import { Check, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

export type PlanCard = {
  slug: string;
  name: string;
  tagline: string;
  highlight?: string;
  /** Formatted by the server from the live Stripe price, e.g. "€19". */
  price: string | null;
  /** Bare euro amount behind `price`, for computing the yearly saving. */
  amount: number | null;
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
};

type Cycle = "month" | "year";

function Feature({ children, tone }: { children: React.ReactNode; tone: "muted" | "accent" }) {
  return (
    <li className="flex gap-2.5 text-sm">
      <Check
        className={`mt-0.5 size-4 shrink-0 ${
          tone === "accent" ? "text-accent" : "text-muted"
        }`}
        aria-hidden="true"
      />
      <span className={tone === "accent" ? "text-foreground" : "text-muted"}>
        {children}
      </span>
    </li>
  );
}

export default function PricingPlans({
  plans,
  currentPlan,
  sellingClosed = false,
}: PricingPlansProps) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cycle, setCycle] = useState<Cycle>("month");

  const free = plans.find((plan) => plan.slug === "free") ?? null;
  const monthly = plans.find((plan) => plan.interval === "month" && plan.slug !== "free") ?? null;
  const yearly = plans.find((plan) => plan.interval === "year") ?? null;

  // Falls back to whichever variant actually has a price, so a deployment with
  // only one Stripe plan configured still renders instead of showing nothing.
  const pro = (cycle === "year" ? yearly : monthly) ?? monthly ?? yearly ?? null;

  const savingsPercent = useMemo(() => {
    if (!monthly?.amount || !yearly?.amount) return null;
    const percent = Math.round((1 - yearly.amount / (monthly.amount * 12)) * 100);
    return percent > 0 ? percent : null;
  }, [monthly, yearly]);

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
        setError(body?.error ?? "Could not start checkout. Try again.");
        setPending(null);
        return;
      }

      // Stripe hosts the payment page; card details never touch this app.
      window.location.assign(body.url);
    } catch {
      setError("Could not reach the server. Check your connection.");
      setPending(null);
    }
  }

  const proIsCurrent = pro !== null && pro.slug === currentPlan;

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

      {yearly && monthly ? (
        <div className="mb-6 flex justify-center">
          <div
            role="tablist"
            aria-label="Billing cycle"
            className="inline-flex rounded-full border border-line bg-surface-raised p-1"
          >
            {(["month", "year"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={cycle === option}
                onClick={() => setCycle(option)}
                className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  cycle === option
                    ? "bg-accent text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {option === "month" ? "Monthly" : "Yearly"}
                {option === "year" && savingsPercent ? (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      cycle === "year"
                        ? "bg-white/20 text-white"
                        : "bg-positive/15 text-positive"
                    }`}
                  >
                    Save {savingsPercent}%
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_1.15fr]">
        {free ? (
          <section className="flex flex-col rounded-2xl border border-line bg-surface p-6">
            <p className="text-sm font-medium text-muted">{free.name}</p>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">
              {free.price ?? "€0"}
            </p>
            <p className="mt-1.5 text-[13px] text-muted">{free.tagline}</p>

            <ul className="mt-6 flex-1 space-y-2.5">
              {free.features.map((feature) => (
                <Feature key={feature} tone="muted">
                  {feature}
                </Feature>
              ))}
            </ul>

            {currentPlan === "free" || currentPlan === null ? (
              <p className="mt-6 text-center text-xs text-muted">
                {currentPlan === "free" ? "Your current plan" : "Included automatically"}
              </p>
            ) : null}
          </section>
        ) : null}

        {pro ? (
          <section className="glow-ai relative flex flex-col overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-b from-accent-soft to-transparent p-6">
            {pro.highlight ? (
              <span className="absolute right-6 top-0 inline-flex -translate-y-1/2 items-center gap-1 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-lg">
                <Sparkles className="size-3" aria-hidden="true" />
                {pro.highlight}
              </span>
            ) : null}

            <p className="text-sm font-medium text-accent">{pro.name}</p>

            <p className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tabular-nums text-foreground">
                {pro.price ?? "—"}
              </span>
              {pro.interval ? (
                <span className="text-sm font-normal text-muted">
                  / {pro.interval}
                </span>
              ) : null}
            </p>
            <p className="mt-1.5 text-[13px] text-muted">{pro.tagline}</p>

            <ul className="mt-6 flex-1 space-y-2.5">
              {pro.features.map((feature) => (
                <Feature key={feature} tone="accent">
                  {feature}
                </Feature>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => subscribe(pro.slug)}
              disabled={
                sellingClosed || !pro.purchasable || proIsCurrent || pending !== null
              }
              className="mt-6 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_-4px_rgba(242,201,76,0.5)] transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-muted disabled:shadow-none"
            >
              {proIsCurrent
                ? "Current plan"
                : sellingClosed
                  ? "Not for sale yet"
                  : !pro.purchasable
                    ? "Not available yet"
                    : pending === pro.slug
                      ? "Opening checkout…"
                      : "Upgrade to Pro"}
            </button>
          </section>
        ) : null}
      </div>
    </div>
  );
}
