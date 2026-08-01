import type { AiFeature } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  dailyBudgetUsd,
  isPerUserCapped,
  perUserDailyBudgetUsd,
} from "./budget-limits";
import { AI_MODEL } from "./client";
import { COACH_RESERVE_TOKENS, costOfUsage, worstCaseCost } from "./pricing";
import type { AiUsage } from "./types";

export {
  DEFAULT_DAILY_BUDGET_USD,
  DEFAULT_PER_USER_BUDGET_USD,
  dailyBudgetUsd,
  perUserDailyBudgetUsd,
} from "./budget-limits";

/**
 * Which ceiling refused the call.
 *
 * The two mean different things to whoever is reading the message. GLOBAL is the
 * desk being out of budget for everyone until midnight UTC and is nobody's
 * fault; USER is this account having spent its own allowance, which resets the
 * same way but is worth saying differently.
 */
export type BudgetScope = "GLOBAL" | "USER";

/** Thrown when a call would take the day past a spending limit. */
export class AiBudgetError extends Error {
  constructor(
    readonly spentTodayUsd: number,
    readonly limitUsd: number,
    readonly reserveUsd: number,
    readonly scope: BudgetScope = "GLOBAL",
  ) {
    super(
      scope === "USER"
        ? `Your daily AI allowance is used up: $${spentTodayUsd.toFixed(4)} of $${limitUsd.toFixed(2)}`
        : `Daily AI budget reached: $${spentTodayUsd.toFixed(4)} of $${limitUsd.toFixed(2)} spent`,
    );
    this.name = "AiBudgetError";
  }
}

/**
 * Day boundaries are UTC, not server-local.
 *
 * A local boundary would move the reset when the host changes timezone or
 * observes DST, which is a confusing way for a spending limit to behave.
 */
export function startOfUtcDay(now: Date = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/**
 * How long a reservation may stay pending before it is ignored.
 *
 * A serverless invocation that dies mid-call leaves its reservation behind at
 * the worst-case price, and counting that forever would retire the day's
 * budget on a crash. No AI call here runs longer than the route's 300s
 * ceiling, so anything older than this is abandoned rather than in flight.
 */
const STALE_RESERVATION_MS = 10 * 60 * 1000;

/**
 * Today's spend, counting reservations still in flight.
 *
 * Reservations are included on purpose: money that is about to be spent is
 * money the next caller cannot also plan to spend.
 */
export async function spentTodayUsd(now: Date = new Date()): Promise<number> {
  const result = await prisma.aiUsageLog.aggregate({
    _sum: { costUsd: true },
    where: {
      createdAt: { gte: startOfUtcDay(now) },
      OR: [
        { pending: false },
        { pending: true, createdAt: { gt: new Date(now.getTime() - STALE_RESERVATION_MS) } },
      ],
    },
  });

  return result._sum.costUsd?.toNumber() ?? 0;
}

export type Reservation = {
  id: string;
  spentTodayUsd: number;
  limitUsd: number;
  reserveUsd: number;
};

/**
 * Reserves this call's worst-case cost, or refuses it.
 *
 * The check and the write are one transaction behind an advisory lock, which
 * is what makes the limit a limit. Reading the total and then inserting
 * separately lets two simultaneous requests both see the same "spent so far",
 * both conclude they fit, and together go over — with a $2 cap and $0.11
 * calls that is a rounding error, but the same code guards a $200 cap on a
 * busy day, and there it is real money.
 *
 * `pg_advisory_xact_lock` rather than a session lock: it is released on commit,
 * so it works through a transaction pooler and cannot leak a held lock into
 * whatever runs next on that connection.
 */
export async function reserveBudget(
  feature: AiFeature,
  userId: string | null,
  model: string,
  maxTokens: number,
  now: Date = new Date(),
): Promise<Reservation> {
  const limitUsd = dailyBudgetUsd();
  const reserveUsd = worstCaseCost(model, maxTokens);

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('ai_daily_budget'))`;

    const dayStart = startOfUtcDay(now);
    const staleBefore = new Date(now.getTime() - STALE_RESERVATION_MS);

    const total = await tx.aiUsageLog.aggregate({
      _sum: { costUsd: true },
      where: {
        createdAt: { gte: dayStart },
        OR: [
          { pending: false },
          { pending: true, createdAt: { gt: staleBefore } },
        ],
      },
    });

    const spent = total._sum.costUsd?.toNumber() ?? 0;

    if (spent + reserveUsd > limitUsd) {
      throw new AiBudgetError(spent, limitUsd, reserveUsd, "GLOBAL");
    }

    // The account's own share, inside the same lock and the same transaction.
    // Checking it in a second round trip would let two of this user's requests
    // both read the same total, both fit, and together go over — the identical
    // race the application-wide cap is held under one lock to avoid.
    if (userId !== null && isPerUserCapped(feature)) {
      const perUserLimit = perUserDailyBudgetUsd(userId);

      const mine = await tx.aiUsageLog.aggregate({
        _sum: { costUsd: true },
        where: {
          userId,
          feature,
          createdAt: { gte: dayStart },
          OR: [
            { pending: false },
            { pending: true, createdAt: { gt: staleBefore } },
          ],
        },
      });

      const spentByUser = mine._sum.costUsd?.toNumber() ?? 0;

      if (spentByUser + reserveUsd > perUserLimit) {
        throw new AiBudgetError(spentByUser, perUserLimit, reserveUsd, "USER");
      }
    }

    const row = await tx.aiUsageLog.create({
      data: {
        userId,
        feature,
        model,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: new Prisma.Decimal(reserveUsd.toFixed(6)),
        pending: true,
      },
      select: { id: true },
    });

    return { id: row.id, spentTodayUsd: spent, limitUsd, reserveUsd };
  });
}

/**
 * Replaces a reservation with what the call actually cost.
 *
 * Never throws: the money is already spent, so a bookkeeping failure must not
 * also fail the user's request. It does leave the reservation at its worst
 * case, which over-counts rather than under-counts — the safe direction.
 */
export async function settleReservation(
  reservationId: string,
  usage: AiUsage,
): Promise<number> {
  const costUsd = costOfUsage(usage);

  try {
    await prisma.aiUsageLog.update({
      where: { id: reservationId },
      data: {
        model: usage.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cacheCreationInputTokens: usage.cacheCreationInputTokens,
        cacheReadInputTokens: usage.cacheReadInputTokens,
        costUsd: new Prisma.Decimal(costUsd.toFixed(6)),
        pending: false,
      },
    });
  } catch (error) {
    console.error(
      "CRITICAL: an AI call was not settled — the budget guard is holding its worst-case reserve instead of the real cost.",
      error,
    );
  }

  return costUsd;
}

/** Drops a reservation for a call that never reached the provider. */
export async function releaseReservation(reservationId: string): Promise<void> {
  try {
    await prisma.aiUsageLog.delete({ where: { id: reservationId } });
  } catch (error) {
    console.error(`Could not release AI budget reservation ${reservationId}:`, error);
  }
}

/**
 * Records a completed call. Never throws: the money is already spent, so a
 * logging failure must not also fail the user's request — but it does leave
 * the budget guard blind, so it is logged loudly.
 */
export async function recordUsage(
  feature: AiFeature,
  userId: string | null,
  usage: AiUsage,
): Promise<number> {
  const costUsd = costOfUsage(usage);

  try {
    await prisma.aiUsageLog.create({
      data: {
        userId,
        feature,
        model: usage.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cacheCreationInputTokens: usage.cacheCreationInputTokens,
        cacheReadInputTokens: usage.cacheReadInputTokens,
        costUsd: new Prisma.Decimal(costUsd.toFixed(6)),
      },
    });
  } catch (error) {
    console.error(
      "CRITICAL: AI usage was not recorded — the daily budget guard is now under-counting spend.",
      error,
    );
  }

  return costUsd;
}

export type BudgetStatus = {
  spentTodayUsd: number;
  limitUsd: number;
  remainingUsd: number;
  blocked: boolean;
  resetsAt: string;
};

export async function budgetStatus(): Promise<BudgetStatus> {
  const limitUsd = dailyBudgetUsd();
  const spent = await spentTodayUsd();
  const nextReset = new Date(startOfUtcDay().getTime() + 24 * 60 * 60 * 1000);

  return {
    spentTodayUsd: Number(spent.toFixed(6)),
    limitUsd,
    remainingUsd: Number(Math.max(limitUsd - spent, 0).toFixed(6)),
    blocked: spent >= limitUsd,
    resetsAt: nextReset.toISOString(),
  };
}

export type CoachBudgetStatus = {
  spentTodayUsd: number;
  limitUsd: number;
  remainingUsd: number;
  /**
   * How many more reviews this account can start today, at today's prices.
   *
   * An estimate, not a promise: it is the same division the reservation gate
   * itself will apply on the next call, so it is honest about what happens
   * next rather than optimistic about it. A review that runs unusually long
   * still costs more than this figure assumes, which is why the constant it
   * divides by is a measured ceiling and not an average.
   */
  reviewsRemaining: number;
  /**
   * Roughly how many reviews this account's own daily ceiling buys in total,
   * ignoring the application-wide cap. Shown as the "of Y" in "X of Y reviews
   * left today" — a number that describes the plan, not today's remainder, so
   * it should not itself shrink as the account spends through the day.
   */
  estimatedDailyReviews: number;
  resetsAt: string;
};

/**
 * What this account can still spend on Coach reviews today, and roughly how
 * many that buys.
 *
 * Reads both ceilings that `reserveBudget` enforces — this account's own share
 * and the application-wide total — because a per-account allowance that looks
 * healthy is not usable when the whole desk's budget is nearly spent. The
 * smaller of the two is what the reader is actually held to, so it is the
 * smaller of the two that is shown.
 */
export async function coachBudgetStatus(
  userId: string,
  now: Date = new Date(),
): Promise<CoachBudgetStatus> {
  const dayStart = startOfUtcDay(now);
  const staleBefore = new Date(now.getTime() - STALE_RESERVATION_MS);
  const perUserLimit = perUserDailyBudgetUsd(userId);

  const [mine, appWideSpent] = await Promise.all([
    prisma.aiUsageLog.aggregate({
      _sum: { costUsd: true },
      where: {
        userId,
        feature: "TRADE_COACH",
        createdAt: { gte: dayStart },
        OR: [
          { pending: false },
          { pending: true, createdAt: { gt: staleBefore } },
        ],
      },
    }),
    spentTodayUsd(now),
  ]);

  const spentByUser = mine._sum.costUsd?.toNumber() ?? 0;
  const appWideLimit = dailyBudgetUsd();

  const remainingForUser = Math.max(perUserLimit - spentByUser, 0);
  const remainingForApp = Math.max(appWideLimit - appWideSpent, 0);
  const remainingUsd = Math.min(remainingForUser, remainingForApp);

  const reservePerReview = worstCaseCost(AI_MODEL, COACH_RESERVE_TOKENS);
  const reviewsRemaining =
    reservePerReview > 0
      ? Math.max(0, Math.floor(remainingUsd / reservePerReview))
      : 0;
  const estimatedDailyReviews =
    reservePerReview > 0 ? Math.floor(perUserLimit / reservePerReview) : 0;

  const nextReset = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  return {
    spentTodayUsd: Number(spentByUser.toFixed(6)),
    limitUsd: perUserLimit,
    remainingUsd: Number(remainingUsd.toFixed(6)),
    reviewsRemaining,
    estimatedDailyReviews,
    resetsAt: nextReset.toISOString(),
  };
}
