import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateReferralCode } from "./code";

/** Qualified invites needed before a bonus is granted. */
export const INVITES_PER_REWARD = 3;

/** How long a granted bonus lasts. */
export const REWARD_DAYS = 7;

/** Clerk's user filter accepts at most 100 ids per call. */
const CLERK_BATCH = 100;

export type ReferralStatus = {
  code: string;
  /** Invites that count towards a bonus. */
  qualifiedInvites: number;
  /** Sign-ups whose email is not verified yet, so they do not count. */
  pendingInvites: number;
  invitesUntilNextReward: number;
  /** Bonuses already granted, newest first. */
  rewards: { grantedAt: Date; expiresAt: Date; active: boolean }[];
};

/**
 * The user's referral code, created the first time they look at it.
 *
 * Created on demand rather than at sign-up: most users never open the referral
 * page, and a code nobody has is a row nobody needs.
 */
export async function getOrCreateCode(userId: string): Promise<string> {
  const existing = await prisma.referral.findUnique({ where: { userId } });
  if (existing) return existing.code;

  // A collision is vanishingly unlikely, but a unique constraint means it
  // fails loudly rather than silently handing two people the same code.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const created = await prisma.referral.create({
        data: { userId, code: generateReferralCode() },
      });
      return created.code;
    } catch {
      const raced = await prisma.referral.findUnique({ where: { userId } });
      if (raced) return raced.code;
    }
  }

  throw new Error(`Could not allocate a referral code for ${userId}`);
}

/**
 * Records who invited a user, if anybody did.
 *
 * Only ever set once, and never to the user's own code. Without both checks a
 * user could re-point their own attribution after the fact, or invite
 * themselves.
 */
export async function attachReferrer(
  userId: string,
  referredByCode: string | null,
): Promise<void> {
  if (!referredByCode) return;

  const existing = await prisma.referral.findUnique({ where: { userId } });
  if (existing?.referredByCode) return;
  if (existing?.code === referredByCode) return;

  const inviter = await prisma.referral.findUnique({
    where: { code: referredByCode },
    select: { userId: true },
  });

  if (!inviter || inviter.userId === userId) return;

  await prisma.referral.upsert({
    where: { userId },
    create: { userId, code: generateReferralCode(), referredByCode },
    update: { referredByCode },
  });
}

/**
 * Attributes a new account to whoever invited it, once.
 *
 * Two paths lead here and both matter: the visitor clicked an invite link and
 * signed up straight away (the code travels in a cookie), or they joined the
 * waitlist through the link first and registered weeks later (the code is on
 * their waitlist row, found by email).
 *
 * Returns quickly for everybody who already has a code, which is everybody
 * after their first page load.
 */
export async function ensureReferralLinked(
  userId: string,
  cookieCode: string | null,
  email: string | null,
): Promise<void> {
  const existing = await prisma.referral.findUnique({ where: { userId } });
  if (existing) return;

  let code = cookieCode;

  if (!code && email) {
    const waitlisted = await prisma.waitlistEntry.findUnique({
      where: { email: email.toLowerCase() },
      select: { referredByCode: true },
    });
    code = waitlisted?.referredByCode ?? null;
  }

  await prisma.referral.create({
    data: { userId, code: generateReferralCode() },
  });

  await attachReferrer(userId, code);

  if (email) {
    // Mark the waitlist row as converted so the same address cannot be
    // credited to a second account later.
    await prisma.waitlistEntry
      .updateMany({
        where: { email: email.toLowerCase(), convertedUserId: null },
        data: { convertedUserId: userId, convertedAt: new Date() },
      })
      .catch(() => {});
  }
}

/**
 * Counts invites that actually qualify.
 *
 * A sign-up only counts once its email address is verified. Without that,
 * three throwaway addresses buy a free week, which is the whole of the fraud
 * this program invites — and verification is the cheapest check that costs a
 * fraudster something real.
 */
async function countQualified(
  code: string,
): Promise<{ qualified: number; pending: number }> {
  const invited = await prisma.referral.findMany({
    where: { referredByCode: code },
    select: { userId: true },
  });

  if (invited.length === 0) return { qualified: 0, pending: 0 };

  const clerk = await clerkClient();
  let qualified = 0;

  for (let i = 0; i < invited.length; i += CLERK_BATCH) {
    const batch = invited.slice(i, i + CLERK_BATCH).map((row) => row.userId);
    const { data } = await clerk.users.getUserList({
      userId: batch,
      limit: CLERK_BATCH,
    });

    for (const user of data) {
      const primary = user.emailAddresses.find(
        (address) => address.id === user.primaryEmailAddressId,
      );

      if (primary?.verification?.status === "verified") qualified += 1;
    }
  }

  return { qualified, pending: invited.length - qualified };
}

/**
 * Grants any bonus the invite count has earned and not yet been given.
 *
 * The unique key on (userId, atInviteCount) is what makes this safe to call on
 * every page load: the second attempt at the same threshold is rejected by the
 * database rather than by a check that two concurrent requests could both pass.
 */
async function grantDueRewards(
  userId: string,
  qualified: number,
  now: Date,
): Promise<void> {
  const earned = Math.floor(qualified / INVITES_PER_REWARD);

  for (let n = 1; n <= earned; n += 1) {
    const threshold = n * INVITES_PER_REWARD;

    try {
      await prisma.referralReward.create({
        data: {
          userId,
          atInviteCount: threshold,
          expiresAt: new Date(now.getTime() + REWARD_DAYS * 24 * 60 * 60 * 1000),
        },
      });
    } catch {
      // Already granted for this threshold.
    }
  }
}

export async function referralStatus(
  userId: string,
  now: Date = new Date(),
): Promise<ReferralStatus> {
  const code = await getOrCreateCode(userId);
  const { qualified, pending } = await countQualified(code);

  await grantDueRewards(userId, qualified, now);

  const rewards = await prisma.referralReward.findMany({
    where: { userId },
    orderBy: { grantedAt: "desc" },
    select: { grantedAt: true, expiresAt: true },
  });

  const remainder = qualified % INVITES_PER_REWARD;

  return {
    code,
    qualifiedInvites: qualified,
    pendingInvites: pending,
    invitesUntilNextReward: INVITES_PER_REWARD - remainder,
    rewards: rewards.map((reward) => ({
      ...reward,
      active: reward.expiresAt.getTime() > now.getTime(),
    })),
  };
}

/** Whether an unexpired referral bonus is currently giving this user access. */
export async function hasActiveReward(
  userId: string,
  now: Date = new Date(),
): Promise<boolean> {
  const reward = await prisma.referralReward.findFirst({
    where: { userId, expiresAt: { gt: now } },
    select: { id: true },
  });

  return reward !== null;
}
