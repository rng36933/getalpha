import { prisma } from "@/lib/prisma";

export type ErasureResult = {
  trades: number;
  watchlistItems: number;
  emailPreferences: number;
  subscriptions: number;
  mtConnections: number;
  supportTickets: number;
  referrals: number;
  referralRewards: number;
  aiUsageLogs: number;
  legalAcceptances: number;
};

/**
 * Deletes everything held against one account.
 *
 * There is no `User` table to cascade from — Clerk owns identity and every
 * table here refers to a person by a bare `userId` string — so deletion has to
 * be explicit. That is easy to forget, and forgetting it means an account
 * "deleted" in Clerk leaves its trades, subscription and preferences behind:
 * exactly the orphan the privacy policy promises does not exist.
 *
 * Every table that carries a `userId` has to be named here, and the first
 * version of this function named six of ten. The four it missed were the ones
 * added after it was written — `MtConnection` above all, which holds a broker
 * name, an account number and the currency of somebody's live trading account.
 * A deletion that leaves that behind is worse than no deletion, because it was
 * promised. When a table gains a `userId`, it belongs in this function on the
 * same commit.
 *
 * What is deliberately kept:
 *
 * - `LegalAcceptance`, which is the evidence that this person agreed to the
 *   terms. Erasing it on request would destroy the record needed to establish
 *   or defend a claim, which is a recognised limit on the right to erasure.
 * - `AiUsageLog`, but with the `userId` set to null rather than the rows
 *   removed. The daily spending cap sums that table, and deleting rows from it
 *   would hand a fresh budget to anyone who deletes their account. Without the
 *   user id the rows are no longer personal data — they are just costs.
 * - `Referral.referredByCode` on *other* people's rows. Deleting this account's
 *   own `Referral` removes its code, but the invitees' record of where they
 *   came from is a plain string rather than a foreign key, and survives on
 *   purpose — see the note on that field.
 */
export async function eraseUserData(userId: string): Promise<ErasureResult> {
  return prisma.$transaction(async (tx) => {
    const trades = await tx.trade.deleteMany({ where: { userId } });
    const watchlistItems = await tx.watchlistItem.deleteMany({ where: { userId } });
    const emailPreferences = await tx.emailPreference.deleteMany({ where: { userId } });
    const subscriptions = await tx.subscription.deleteMany({ where: { userId } });

    // The broker, the account number and the token hash for somebody's live
    // terminal. Nothing here is recoverable or needed once the account is gone,
    // and a stale connection row would also let a still-running EA keep posting
    // trades for a user that no longer exists.
    const mtConnections = await tx.mtConnection.deleteMany({ where: { userId } });

    // Free text somebody typed about their own trading, so it goes with them.
    // Deleted rather than anonymised because `userId` is not nullable here and
    // a support thread with the person removed from it is not worth a migration.
    const supportTickets = await tx.supportTicket.deleteMany({
      where: { userId },
    });

    const referralRewards = await tx.referralReward.deleteMany({
      where: { userId },
    });
    const referrals = await tx.referral.deleteMany({ where: { userId } });

    const aiUsageLogs = await tx.aiUsageLog.updateMany({
      where: { userId },
      data: { userId: null },
    });

    const legalAcceptances = await tx.legalAcceptance.count({ where: { userId } });

    return {
      trades: trades.count,
      watchlistItems: watchlistItems.count,
      emailPreferences: emailPreferences.count,
      subscriptions: subscriptions.count,
      mtConnections: mtConnections.count,
      supportTickets: supportTickets.count,
      referrals: referrals.count,
      referralRewards: referralRewards.count,
      aiUsageLogs: aiUsageLogs.count,
      legalAcceptances,
    };
  });
}
