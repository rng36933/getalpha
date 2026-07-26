import type { AiFeature } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { costOfUsage, worstCaseCost } from "./pricing";
import type { AiUsage } from "./types";

export const DEFAULT_DAILY_BUDGET_USD = 2;

/** Thrown when a call would take the day past its spending limit. */
export class AiBudgetError extends Error {
  constructor(
    readonly spentTodayUsd: number,
    readonly limitUsd: number,
    readonly reserveUsd: number,
  ) {
    super(
      `Daily AI budget reached: $${spentTodayUsd.toFixed(4)} of $${limitUsd.toFixed(2)} spent`,
    );
    this.name = "AiBudgetError";
  }
}

/** Reads AI_DAILY_BUDGET_USD, falling back to the default when unusable. */
export function dailyBudgetUsd(): number {
  const raw = process.env.AI_DAILY_BUDGET_USD;
  if (raw === undefined || raw.trim() === "") return DEFAULT_DAILY_BUDGET_USD;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    console.warn(
      `AI_DAILY_BUDGET_USD="${raw}" is not a valid amount — using $${DEFAULT_DAILY_BUDGET_USD}.`,
    );
    return DEFAULT_DAILY_BUDGET_USD;
  }

  return parsed;
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
      throw new AiBudgetError(spent, limitUsd, reserveUsd);
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
