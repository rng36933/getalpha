import { clerkClient } from "@clerk/nextjs/server";
import { SubscriptionStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** Clerk's user filter accepts at most 100 ids per call. */
const CLERK_BATCH = 100;

export type Recipient = {
  userId: string;
  email: string;
};

/**
 * Everyone who should get the morning email.
 *
 * Two filters, and the second is easy to forget: the Session Brief is a paid
 * module, so mailing it to every opted-in account would hand the thing being
 * sold to people who did not buy it.
 *
 * Addresses come from Clerk at send time rather than from a stored copy, so a
 * user who changes their email gets the next one at the new address and the
 * app never holds a second, staler record of it.
 */
export async function dailyBriefRecipients(
  now: Date = new Date(),
): Promise<Recipient[]> {
  const optedIn = await prisma.emailPreference.findMany({
    where: { dailyBrief: true },
    select: { userId: true },
  });

  if (optedIn.length === 0) return [];

  const entitled = await prisma.subscription.findMany({
    where: {
      userId: { in: optedIn.map((p) => p.userId) },
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
        // Cancelled, but the period they paid for has not run out yet.
        { currentPeriodEnd: { gt: now } },
      ],
    },
    select: { userId: true },
  });

  if (entitled.length === 0) return [];

  const clerk = await clerkClient();
  const recipients: Recipient[] = [];

  for (let i = 0; i < entitled.length; i += CLERK_BATCH) {
    const batch = entitled.slice(i, i + CLERK_BATCH).map((s) => s.userId);

    const { data } = await clerk.users.getUserList({
      userId: batch,
      limit: CLERK_BATCH,
    });

    for (const user of data) {
      const primary = user.emailAddresses.find(
        (address) => address.id === user.primaryEmailAddressId,
      );

      // An unverified address is one somebody typed, not one they proved they
      // own. Sending there risks mailing a stranger and burning the domain's
      // sending reputation on a bounce.
      if (!primary || primary.verification?.status !== "verified") continue;

      recipients.push({ userId: user.id, email: primary.emailAddress });
    }
  }

  return recipients;
}
