import { clerkClient } from "@clerk/nextjs/server";
import { SubscriptionStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { promo2x1Html, promo2x1Subject, promo2x1Text } from "./promo-2x1-template";
import { resend } from "./resend";

/** Resend accepts at most 100 messages per batch call, Clerk at most 500 users per page. */
const RESEND_BATCH = 100;
const CLERK_PAGE = 500;

/** Statuses (or referral rewards, or comp access) that make someone not eligible for the promo. */
async function alreadyEntitledUserIds(now: Date): Promise<Set<string>> {
  const [subscribed, rewarded] = await Promise.all([
    prisma.subscription.findMany({
      where: {
        OR: [
          {
            status: {
              in: [
                SubscriptionStatus.ACTIVE,
                SubscriptionStatus.TRIALING,
                SubscriptionStatus.PAST_DUE,
              ],
            },
          },
          { currentPeriodEnd: { gt: now } },
        ],
      },
      select: { userId: true },
    }),
    prisma.referralReward.findMany({
      where: { expiresAt: { gt: now } },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  const comped = (process.env.PRO_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id !== "");

  return new Set([
    ...subscribed.map((s) => s.userId),
    ...rewarded.map((r) => r.userId),
    ...comped,
  ]);
}

type Recipient = { userId: string; email: string; firstName: string | null };

/**
 * Every registered account that is not already entitled to Pro (paid,
 * comped, or via an active referral reward), has not already been sent this
 * campaign, and has a verified primary email.
 */
async function eligibleRecipients(now: Date): Promise<Recipient[]> {
  const [entitled, alreadySent] = await Promise.all([
    alreadyEntitledUserIds(now),
    prisma.promoEmailSent.findMany({ select: { userId: true } }),
  ]);

  const sentSet = new Set(alreadySent.map((r) => r.userId));

  const clerk = await clerkClient();
  const recipients: Recipient[] = [];
  let offset = 0;

  for (;;) {
    const { data } = await clerk.users.getUserList({ limit: CLERK_PAGE, offset });
    if (data.length === 0) break;

    for (const user of data) {
      if (entitled.has(user.id) || sentSet.has(user.id)) continue;

      const primary = user.emailAddresses.find(
        (address) => address.id === user.primaryEmailAddressId,
      );

      // An unverified address is one somebody typed, not one they proved they
      // own. Sending there risks mailing a stranger and burning the domain's
      // sending reputation on a bounce.
      if (!primary || primary.verification?.status !== "verified") continue;

      recipients.push({
        userId: user.id,
        email: primary.emailAddress,
        firstName: user.firstName,
      });
    }

    if (data.length < CLERK_PAGE) break;
    offset += CLERK_PAGE;
  }

  return recipients;
}

export type PromoSendResult = {
  eligibleTotal: number;
  sent: number;
  failed: number;
  remaining: number;
};

/**
 * Sends the 2-for-1 promo to up to `limit` eligible recipients who have not
 * already received it, recording each as sent before moving to the next
 * batch so a call that runs out of time (see `maxDuration` on the route) can
 * simply be called again rather than needing to resume from a checkpoint.
 */
export async function sendPromo2x1(
  fromAddress: string,
  limit: number,
  now: Date = new Date(),
): Promise<PromoSendResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.getalpha.org";
  const all = await eligibleRecipients(now);
  const toSend = all.slice(0, limit);

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < toSend.length; i += RESEND_BATCH) {
    const batch = toSend.slice(i, i + RESEND_BATCH);

    // One message per recipient, never one message with everybody in `to` —
    // that would show every recipient the whole customer list.
    const messages = batch.map((recipient) => ({
      from: fromAddress,
      to: [recipient.email],
      subject: promo2x1Subject(),
      html: promo2x1Html({ firstName: recipient.firstName, appUrl }),
      text: promo2x1Text({ firstName: recipient.firstName, appUrl }),
    }));

    try {
      const response = await resend().batch.send(messages);

      if (response.error) {
        failed += batch.length;
        console.error("Resend rejected a promo batch:", response.error);
        continue;
      }

      await prisma.promoEmailSent.createMany({
        data: batch.map((r) => ({ userId: r.userId })),
        skipDuplicates: true,
      });
      sent += batch.length;
    } catch (error) {
      failed += batch.length;
      console.error("Sending a promo batch failed:", error);
    }
  }

  return {
    eligibleTotal: all.length,
    sent,
    failed,
    remaining: all.length - toSend.length,
  };
}

/** Recipient count only, for a dry-run preview before actually sending. */
export async function previewPromo2x1(now: Date = new Date()): Promise<{
  eligibleTotal: number;
  sample: string[];
}> {
  const all = await eligibleRecipients(now);
  return { eligibleTotal: all.length, sample: all.slice(0, 5).map((r) => r.email) };
}
