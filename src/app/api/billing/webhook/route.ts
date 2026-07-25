import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { BillingConfigError, stripe, webhookSecret } from "@/lib/billing/stripe";
import { claimEvent, syncSubscription } from "@/lib/billing/subscription";

/**
 * Events worth acting on. Stripe sends far more than this, and answering 200
 * to the rest keeps them out of the retry queue.
 */
const HANDLED = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "invoice.payment_failed",
  "invoice.payment_succeeded",
]);

/**
 * POST /api/billing/webhook
 *
 * The only thing in the app that grants or revokes paid access. The browser
 * coming back from Checkout proves nothing — a user can navigate to the success
 * URL directly — so entitlement is written here, from a signed Stripe event.
 *
 * This route is public in the middleware: Stripe has no Clerk session. The
 * signature is what authenticates it.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // The raw body, byte for byte. Parsing it first and re-serialising would
  // change the bytes and the signature would never verify again.
  const payload = await request.text();

  let event: Stripe.Event;

  try {
    event = await stripe().webhooks.constructEventAsync(
      payload,
      signature,
      webhookSecret(),
    );
  } catch (error) {
    if (error instanceof BillingConfigError) {
      console.error("Stripe webhook is not configured:", error);
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    // A bad signature is either a misconfigured endpoint secret or a forgery.
    // Either way it must not be retried, so answer 400 rather than 500.
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!HANDLED.has(event.type)) {
    return NextResponse.json({ received: true, handled: false });
  }

  const isNew = await claimEvent(event.id, event.type);
  if (!isNew) {
    // Already applied by an earlier delivery of the same event.
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await handle(event);
    return NextResponse.json({ received: true, handled: true });
  } catch (error) {
    // 500 asks Stripe to retry. The event id is already claimed, so release it
    // or the retry would be discarded as a duplicate and access would never be
    // granted.
    await releaseEvent(event.id);

    console.error(`Stripe webhook ${event.type} (${event.id}) failed:`, error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}

async function handle(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;

      // A one-off payment would have no subscription; this app only sells
      // subscriptions, so anything else is not an entitlement.
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (!subscriptionId) return;
      await syncSubscription(subscriptionId);
      return;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed": {
      // Every one of these is handled by re-reading the subscription, which is
      // what makes out-of-order delivery harmless: whichever event arrives
      // last still writes the state Stripe holds right now.
      await syncSubscription(event.data.object.id);
      return;
    }

    case "invoice.payment_failed":
    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      const subscriptionId = subscriptionIdOf(invoice);

      // Not every invoice belongs to a subscription.
      if (!subscriptionId) return;
      await syncSubscription(subscriptionId);
      return;
    }
  }
}

/**
 * Digs the subscription id out of an invoice.
 *
 * Stripe moved it off the invoice and onto the line items' parent, so this
 * walks the lines rather than reading `invoice.subscription`, which no longer
 * exists on the current API version.
 */
function subscriptionIdOf(invoice: Stripe.Invoice): string | null {
  for (const line of invoice.lines?.data ?? []) {
    const parent = line.parent;
    const details =
      parent?.type === "subscription_item_details"
        ? parent.subscription_item_details
        : null;

    if (details?.subscription) return details.subscription;
  }

  return null;
}

async function releaseEvent(eventId: string): Promise<void> {
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.processedStripeEvent.delete({ where: { id: eventId } });
  } catch (error) {
    console.error(`Could not release the claim on event ${eventId}:`, error);
  }
}
