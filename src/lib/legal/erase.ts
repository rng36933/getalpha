import { prisma } from "@/lib/prisma";

export type ErasureResult = {
  trades: number;
  watchlistItems: number;
  emailPreferences: number;
  subscriptions: number;
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
 * What is deliberately kept:
 *
 * - `LegalAcceptance`, which is the evidence that this person agreed to the
 *   terms. Erasing it on request would destroy the record needed to establish
 *   or defend a claim, which is a recognised limit on the right to erasure.
 * - `AiUsageLog`, but with the `userId` set to null rather than the rows
 *   removed. The daily spending cap sums that table, and deleting rows from it
 *   would hand a fresh budget to anyone who deletes their account. Without the
 *   user id the rows are no longer personal data — they are just costs.
 */
export async function eraseUserData(userId: string): Promise<ErasureResult> {
  return prisma.$transaction(async (tx) => {
    const trades = await tx.trade.deleteMany({ where: { userId } });
    const watchlistItems = await tx.watchlistItem.deleteMany({ where: { userId } });
    const emailPreferences = await tx.emailPreference.deleteMany({ where: { userId } });
    const subscriptions = await tx.subscription.deleteMany({ where: { userId } });

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
      aiUsageLogs: aiUsageLogs.count,
      legalAcceptances,
    };
  });
}
