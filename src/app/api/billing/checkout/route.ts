import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { findPlan } from "@/lib/billing/plans";
import {
  BillingConfigError,
  appOrigin,
  sellingIsAllowed,
  subscribeUrl,
} from "@/lib/billing/paypal";
import { PROMO_CODE, promoActive, promoTrialFields } from "@/lib/billing/promo";
import { checkAccess, findOrCreateSubscriptionRow } from "@/lib/billing/subscription";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { requireJsonRequest } from "@/lib/request-guards";

/**
 * POST /api/billing/checkout
 *
 * Body: { plan: "pro-monthly" | "pro-yearly", promo?: "2x1" }
 * Returns: { url } — PayPal's "Subscribe" page to send the browser to.
 *
 * The price is never taken from the request. A client that could name its own
 * price could name zero; the body carries a plan slug and the server resolves
 * it to the amount configured in `plans.ts`.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Before anything else: the live site must not run a sandbox checkout.
  // PayPal's sandbox buyer accounts are free to complete a real approval flow,
  // so that is a free Pro subscription for anyone who tries one — see the
  // note on `sellingIsAllowed`.
  if (!sellingIsAllowed()) {
    console.error(
      "Refusing checkout: the production deployment is holding PayPal sandbox settings.",
    );
    return NextResponse.json(
      { error: "Payments are not open yet" },
      { status: 503 },
    );
  }

  const limited = enforceRateLimit(`checkout:${userId}`, LIMITS.write);
  if (limited) return limited;

  const wrongType = requireJsonRequest(request);
  if (wrongType) return wrongType;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const slug = (body as { plan?: unknown })?.plan;
  if (typeof slug !== "string") {
    return NextResponse.json(
      { error: "plan: required, must be a string" },
      { status: 400 },
    );
  }

  const plan = findPlan(slug);
  if (!plan) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 404 });
  }

  const requestedPromo = (body as { promo?: unknown })?.promo;

  try {
    // The 2x1 promo is for people who are not already paying — applying it to
    // an existing Pro subscriber would just hand out a free cycle on a
    // renewal nobody asked to change.
    const promo =
      requestedPromo === PROMO_CODE &&
      promoActive() &&
      !(await checkAccess(userId)).allowed;

    await findOrCreateSubscriptionRow(userId);
    const origin = appOrigin(request);

    const url = subscribeUrl({
      item_name: `getALPHA Pro (${plan.interval === "year" ? "Yearly" : "Monthly"})`,
      // Echoed back in every IPN as `item_number` — how the webhook learns
      // which plan this subscription is for.
      item_number: plan.slug,
      ...(promo ? promoTrialFields(plan) : {}),
      a3: plan.amount.toFixed(2),
      p3: "1",
      t3: plan.intervalUnit,
      src: "1", // recurring (auto-rebill each cycle)
      sra: "1", // keep retrying a failed charge instead of cancelling outright
      currency_code: "EUR",
      // PayPal's equivalent of Stripe's subscription metadata — read back by
      // the webhook so every IPN message can be traced to an account.
      custom: userId,
      notify_url: `${origin}/api/billing/webhook`,
      return: `${origin}/dashboard/pricing?checkout=success`,
      cancel_return: `${origin}/dashboard/pricing?checkout=cancelled`,
      no_shipping: "1",
    });

    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof BillingConfigError) {
      console.error("POST /api/billing/checkout is not configured:", error);
      return NextResponse.json(
        { error: "Billing is not configured on this server" },
        { status: 503 },
      );
    }

    console.error("POST /api/billing/checkout failed:", error);
    return NextResponse.json(
      { error: "Could not start checkout" },
      { status: 502 },
    );
  }
}
