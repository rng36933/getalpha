import type { AiUsage } from "./types";

/**
 * Anthropic list prices in USD per million tokens.
 *
 * These are hardcoded on purpose: a spend guard that depends on a network
 * lookup fails open exactly when the network is having a bad day. Review this
 * table when Anthropic changes pricing.
 *
 * Last checked: 2026-07-25.
 */
type ModelRate = {
  inputPerMTok: number;
  outputPerMTok: number;
};

const RATES: Record<string, ModelRate> = {
  "claude-fable-5": { inputPerMTok: 10, outputPerMTok: 50 },
  "claude-mythos-5": { inputPerMTok: 10, outputPerMTok: 50 },
  "claude-opus-5": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-opus-4-8": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-opus-4-7": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-opus-4-6": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-sonnet-5": { inputPerMTok: 3, outputPerMTok: 15 },
  "claude-sonnet-4-6": { inputPerMTok: 3, outputPerMTok: 15 },
  "claude-haiku-4-5": { inputPerMTok: 1, outputPerMTok: 5 },
};

/**
 * Used when the response names a model we have no rate for. Deliberately the
 * most expensive rate we know of — an unknown model must never be billed as
 * cheap, or the daily limit silently stops protecting anything.
 */
const UNKNOWN_MODEL_RATE: ModelRate = { inputPerMTok: 10, outputPerMTok: 50 };

/** Cache writes cost 1.25x base input; cache reads cost 0.1x. */
const CACHE_WRITE_MULTIPLIER = 1.25;
const CACHE_READ_MULTIPLIER = 0.1;

/**
 * What the Coach's budget reservation prices itself against, in output tokens.
 *
 * Defined once here rather than duplicated wherever it is needed — `coach.ts`
 * passes it as `reserveTokens`, and the "reviews remaining today" figure shown
 * to a signed-in reader divides their remaining budget by the same number. Two
 * copies of this constant is how those two would quietly drift apart: the
 * displayed count would promise a review the actual gate then refuses.
 *
 * Sized at roughly 1.5x the largest output actually measured (2,664 tokens),
 * not at the Coach's `maxTokens: 16000` — that ceiling exists to stop a
 * response that runs away, not to describe what one typically costs, and
 * reserving against it was the bug this constant fixes.
 */
export const COACH_RESERVE_TOKENS = 4000;

export function rateFor(model: string): ModelRate {
  const rate = RATES[model];

  if (!rate) {
    console.warn(
      `No pricing entry for model "${model}" — billing it at the highest known rate.`,
    );
    return UNKNOWN_MODEL_RATE;
  }

  return rate;
}

export function isKnownModel(model: string): boolean {
  return model in RATES;
}

/** Actual USD cost of a completed call. */
export function costOfUsage(usage: AiUsage): number {
  const rate = rateFor(usage.model);

  const inputCost = usage.inputTokens * rate.inputPerMTok;
  const cacheWriteCost =
    usage.cacheCreationInputTokens * rate.inputPerMTok * CACHE_WRITE_MULTIPLIER;
  const cacheReadCost =
    usage.cacheReadInputTokens * rate.inputPerMTok * CACHE_READ_MULTIPLIER;
  const outputCost = usage.outputTokens * rate.outputPerMTok;

  return (inputCost + cacheWriteCost + cacheReadCost + outputCost) / 1_000_000;
}

/**
 * Upper bound on what a call *could* cost before it runs.
 *
 * Output cost dominates (25 vs 5 per MTok on Opus), and max_tokens is a hard
 * ceiling on output, so pricing the whole output budget gives a safe reserve
 * to check the daily limit against. Input is unknown ahead of time and is not
 * included — the reserve is a guard rail, not an invoice.
 */
export function worstCaseCost(model: string, maxTokens: number): number {
  return (maxTokens * rateFor(model).outputPerMTok) / 1_000_000;
}
