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

export async function spentTodayUsd(): Promise<number> {
  const result = await prisma.aiUsageLog.aggregate({
    _sum: { costUsd: true },
    where: { createdAt: { gte: startOfUtcDay() } },
  });

  return result._sum.costUsd?.toNumber() ?? 0;
}

/**
 * Blocks the call when today's spend plus this call's worst case would breach
 * the limit. Checked before the request, so the limit cannot be blown by a
 * single expensive call landing on an almost-full budget.
 *
 * Not race-safe: two requests issued at the same moment can both pass. For a
 * single-user desk that is acceptable; a multi-user deployment should move
 * this into a transaction that reserves the amount up front.
 */
export async function assertWithinDailyBudget(
  model: string,
  maxTokens: number,
): Promise<{ spentTodayUsd: number; limitUsd: number; reserveUsd: number }> {
  const limitUsd = dailyBudgetUsd();
  const reserveUsd = worstCaseCost(model, maxTokens);
  const spent = await spentTodayUsd();

  if (spent + reserveUsd > limitUsd) {
    throw new AiBudgetError(spent, limitUsd, reserveUsd);
  }

  return { spentTodayUsd: spent, limitUsd, reserveUsd };
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
