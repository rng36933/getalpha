import { SubscriptionStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { hasActiveReward } from "@/lib/referral/program";
import { hasComplimentaryAccess } from "./complimentary";
import { findPlan } from "./plans";

/**
 * Statuses that unlock the paid modules.
 *
 * PAST_DUE is included on purpose: PayPal retries a failed recurring charge
 * for a while, and locking a paying customer out on the first declined charge
 * loses more than the grace period costs.
 */
const ENTITLED: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.PAST_DUE,
];

export type Access =
  /** Paid up, or inside a period already paid for. */
  | { allowed: true; reason: "SUBSCRIBED" | "PERIOD_REMAINING" }
  /** An unexpired referral bonus, which is access without a payment. */
  | { allowed: true; reason: "REFERRAL_REWARD" }
  /** Handed the paid modules outright by the operator. */
  | { allowed: true; reason: "COMPLIMENTARY" }
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
  // Checked before the database, so a comped account keeps working through an
  // outage that would otherwise fail closed on it.
  if (hasComplimentaryAccess(userId)) {
    return { allowed: true, reason: "COMPLIMENTARY" };
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (subscription && ENTITLED.includes(subscription.status)) {
      return { allowed: true, reason: "SUBSCRIBED" };
    }

    if (!subscription) {
      // Never paid, but may have earned access by inviting people.
      return (await hasActiveReward(userId))
        ? { allowed: true, reason: "REFERRAL_REWARD" }
        : { allowed: false, reason: "NO_SUBSCRIPTION" };
    }

    // Cancelled, but the period they already paid for has not run out.
    if (
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd.getTime() > Date.now()
    ) {
      return { allowed: true, reason: "PERIOD_REMAINING" };
    }

    // A lapsed subscriber can still be inside a referral bonus.
    return (await hasActiveReward(userId))
      ? { allowed: true, reason: "REFERRAL_REWARD" }
      : { allowed: false, reason: "NO_SUBSCRIPTION" };
  } catch (error) {
    console.error(`Could not read the subscription for ${userId}:`, error);
    return { allowed: false, reason: "UNKNOWN" };
  }
}

export async function getSubscription(userId: string) {
  return prisma.subscription.findUnique({ where: { userId } });
}

/**
 * Ensures a subscription row exists for this user before sending them to
 * PayPal, so the IPN that comes back afterwards has a row to update.
 */
export async function findOrCreateSubscriptionRow(userId: string): Promise<void> {
  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, status: SubscriptionStatus.INCOMPLETE },
    update: {},
  });
}

export type IpnFields = Record<string, string>;

/**
 * PayPal's recurring-billing date format, e.g. "05:00:00 Jan 25, 2027 PST".
 *
 * The zone abbreviation is dropped rather than mapped to an offset — this
 * value only feeds the "still inside a paid period after cancelling" grace
 * check, never the entitlement decision itself (that is `status`), so being
 * off by the difference between the zone and UTC is harmless here.
 */
function parseNextPaymentDate(value: string): Date | null {
  const match = value.match(/^(\d{2}:\d{2}:\d{2}) (\w{3} \d{1,2}, \d{4})/);
  if (!match) return null;

  const [, time, datePart] = match;
  const parsed = new Date(`${datePart} ${time} UTC`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Applies one verified PayPal IPN message to the database.
 *
 * Unlike a REST webhook, classic IPN has no separate "re-fetch the object"
 * step — the verified message itself (see `verifyIpn`) is the trusted source,
 * so this writes what it says directly rather than re-reading anything.
 */
export async function applyIpn(fields: IpnFields): Promise<void> {
  const userId = fields.custom || null;
  if (!userId) {
    console.error(`PayPal IPN ${fields.txn_type} has no custom userId; ignoring.`);
    return;
  }

  const data: {
    paypalSubscriptionId?: string;
    planSlug?: string;
    status?: SubscriptionStatus;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: Date;
  } = {};

  if (fields.subscr_id) data.paypalSubscriptionId = fields.subscr_id;
  if (fields.item_number && findPlan(fields.item_number)) {
    data.planSlug = fields.item_number;
  }

  switch (fields.txn_type) {
    case "subscr_signup":
      data.status = SubscriptionStatus.ACTIVE;
      data.cancelAtPeriodEnd = false;
      break;
    case "subscr_payment":
      if (fields.payment_status === "Completed") {
        data.status = SubscriptionStatus.ACTIVE;
      }
      break;
    case "subscr_failed":
      data.status = SubscriptionStatus.PAST_DUE;
      break;
    case "subscr_cancel":
      // Auto-renew turned off, but the buyer keeps access to the period
      // already paid for — `subscr_eot` is the actual end of access.
      data.cancelAtPeriodEnd = true;
      break;
    case "subscr_eot":
      data.status = SubscriptionStatus.CANCELED;
      break;
  }

  if (fields.next_payment_date) {
    const parsed = parseNextPaymentDate(fields.next_payment_date);
    if (parsed) data.currentPeriodEnd = parsed;
  }

  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, status: SubscriptionStatus.INCOMPLETE, ...data },
    update: data,
  });
}

/**
 * Records that an IPN delivery has been handled, and reports whether it is new.
 *
 * PayPal retries IPN until it receives a 200, and classic IPN carries no
 * event id to dedupe on — the caller hashes the verified message body instead,
 * since a retried delivery resends the identical bytes.
 */
export async function claimEvent(
  eventId: string,
  type: string,
): Promise<boolean> {
  try {
    await prisma.processedPaypalEvent.create({ data: { id: eventId, type } });
    return true;
  } catch {
    // Unique violation: another delivery of the same message got here first.
    return false;
  }
}
