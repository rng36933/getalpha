import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { findPlan, priceIdFor } from "@/lib/billing/plans";
import {
  BillingConfigError,
  appOrigin,
  sellingIsAllowed,
  stripe,
} from "@/lib/billing/stripe";
import { findOrCreateCustomer } from "@/lib/billing/subscription";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { requireJsonRequest } from "@/lib/request-guards";

/**
 * POST /api/billing/checkout
 *
 * Body: { plan: "pro-monthly" | "pro-yearly" }
 * Returns: { url } — the Stripe Checkout page to send the browser to.
 *
 * The price is never taken from the request. A client that could name its own
 * price could name zero; the body carries a plan slug and the server resolves
 * it to a price id it configured itself.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Before anything else: the live site must not run a test-mode checkout.
  // Stripe's test cards are public, so that is a free Pro subscription for
  // anyone who tries one — see the note on `sellingIsAllowed`.
  if (!sellingIsAllowed()) {
    console.error(
      "Refusing checkout: the production deployment is holding Stripe test keys.",
    );
    return NextResponse.json(
      { error: "Payments are not open yet" },
      { status: 503 },
    );
  }

  // Each call creates a Stripe Checkout session, and the first one for an
  // account creates a Stripe customer. Unbounded, that is somebody able to fill
  // the billing dashboard with junk objects from a loop.
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

  const priceId = priceIdFor(plan);
  if (!priceId) {
    console.error(`${plan.priceEnv} is not set; cannot start checkout.`);
    return NextResponse.json(
      { error: "That plan is not available for purchase yet" },
      { status: 503 },
    );
  }

  try {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? null;

    const customerId = await findOrCreateCustomer(userId, email);
    const origin = appOrigin(request);

    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      // The webhook is the only thing that grants access, but these let the
      // browser show the right thing the moment it comes back.
      success_url: `${origin}/dashboard/pricing?checkout=success`,
      cancel_url: `${origin}/dashboard/pricing?checkout=cancelled`,
      client_reference_id: userId,
      // Copied onto the subscription itself, so every later webhook can be
      // traced back to an account without a database lookup.
      subscription_data: { metadata: { userId, planSlug: plan.slug } },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      throw new Error("Stripe returned a checkout session with no URL");
    }

    return NextResponse.json({ url: session.url });
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
