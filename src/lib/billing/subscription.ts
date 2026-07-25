import type Stripe from "stripe";
import { SubscriptionStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { planSlugForPrice } from "./plans";
import { stripe } from "./stripe";

/**
 * Statuses that unlock the paid modules.
 *
 * PAST_DUE is included on purpose: Stripe retries a failed card for around two
 * weeks, and locking a paying customer out on the first declined charge loses
 * more than the fortnight of usage costs.
 */
const ENTITLED: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.PAST_DUE,
];

export type Access =
  /** Paid up, or inside a period already paid for. */
  | { allowed: true; reason: "SUBSCRIBED" | "PERIOD_REMAINING" }
  /** Never subscribed, or the subscription ended. */
  | { allowed: false; reason: "NO_SUBSCRIPTION" }
  /** The entitlement could not be read. Fails closed, but says so. */
  | { allowed: false; reason: "UNKNOWN" };

/**
 * Whether this user may use the paid modules.
 *
 * Fails closed on a database error, and reports it as UNKNOWN rather than
 * NO_SUBSCRIPTION — a paying customer must be told the check broke, not that
 * they need to buy something they already own.
 */
export async function checkAccess(userId: string): Promise<Access> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) return { allowed: false, reason: "NO_SUBSCRIPTION" };

    if (ENTITLED.includes(subscription.status)) {
      return { allowed: true, reason: "SUBSCRIBED" };
    }

    // Cancelled, but the period they already paid for has not run out.
    if (
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd.getTime() > Date.now()
    ) {
      return { allowed: true, reason: "PERIOD_REMAINING" };
    }

    return { allowed: false, reason: "NO_SUBSCRIPTION" };
  } catch (error) {
    console.error(`Could not read the subscription for ${userId}:`, error);
    return { allowed: false, reason: "UNKNOWN" };
  }
}

export async function getSubscription(userId: string) {
  return prisma.subscription.findUnique({ where: { userId } });
}

/**
 * The user's Stripe customer, created on first checkout and reused after that.
 *
 * Reused deliberately: creating a customer per checkout would scatter one
 * person's payment history across several Stripe customers and break the
 * billing portal.
 */
export async function findOrCreateCustomer(
  userId: string,
  email: string | null,
): Promise<string> {
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing) return existing.stripeCustomerId;

  const customer = await stripe().customers.create({
    email: email ?? undefined,
    // Written on the customer as well as the session, so a Stripe object found
    // from the dashboard can always be traced back to an account.
    metadata: { userId },
  });

  await prisma.subscription.create({
    data: {
      userId,
      stripeCustomerId: customer.id,
      status: SubscriptionStatus.INCOMPLETE,
    },
  });

  return customer.id;
}

function toStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  switch (stripeStatus) {
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "trialing":
      return SubscriptionStatus.TRIALING;
    case "past_due":
    case "unpaid":
    case "paused":
      return SubscriptionStatus.PAST_DUE;
    case "canceled":
    case "incomplete_expired":
      return SubscriptionStatus.CANCELED;
    case "incomplete":
      return SubscriptionStatus.INCOMPLETE;
  }
}

/**
 * The end of the period the customer has paid for.
 *
 * Stripe moved `current_period_end` off the subscription and onto its items,
 * so this reads the items and takes the latest — with more than one item, the
 * customer keeps access until the last of them lapses.
 */
function periodEnd(subscription: Stripe.Subscription): Date | null {
  const ends = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number");

  if (ends.length === 0) return null;
  return new Date(Math.max(...ends) * 1000);
}

/**
 * Writes the current state of one Stripe subscription into the database.
 *
 * Always re-reads the subscription from Stripe rather than trusting the event
 * payload. Webhooks arrive out of order — a `customer.subscription.updated`
 * from the cancellation can land after the `deleted` that followed it — and
 * applying a stale payload would restore access that was just revoked.
 */
export async function syncSubscription(subscriptionId: string): Promise<void> {
  const subscription = await stripe().subscriptions.retrieve(subscriptionId);

  const userId = subscription.metadata?.userId;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const price = subscription.items.data[0]?.price;
  const priceId = price?.id ?? null;

  const data = {
    stripeSubscriptionId: subscription.id,
    status: toStatus(subscription.status),
    planSlug: planSlugForPrice(priceId),
    stripePriceId: priceId,
    currentPeriodEnd: periodEnd(subscription),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };

  // Matched on the customer, which exists from the very first checkout, rather
  // than on the subscription id, which does not exist until checkout completes.
  const updated = await prisma.subscription.updateMany({
    where: { stripeCustomerId: customerId },
    data,
  });

  if (updated.count > 0) return;

  // No row yet — possible if the customer was created straight in Stripe's
  // dashboard. Only recoverable when the subscription carries the user id.
  if (!userId) {
    console.error(
      `Stripe subscription ${subscription.id} has no local row and no userId in metadata; ignoring.`,
    );
    return;
  }

  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, stripeCustomerId: customerId, ...data },
    update: { stripeCustomerId: customerId, ...data },
  });
}

/**
 * Records that an event has been handled, and reports whether it is new.
 *
 * Stripe retries until it receives a 2xx and does not promise exactly-once
 * delivery, so every handler runs behind this.
 */
export async function claimEvent(
  eventId: string,
  type: string,
): Promise<boolean> {
  try {
    await prisma.processedStripeEvent.create({ data: { id: eventId, type } });
    return true;
  } catch {
    // Unique violation: another delivery of the same event got here first.
    return false;
  }
}
