/**
 * The programme's arithmetic: how many invites buy a bonus, how long it lasts,
 * and how many an account can ever earn.
 *
 * Its own module so `npm test` can reach it — `program.ts` imports Prisma and
 * the Clerk backend SDK, and the bare node test runner resolves neither. Same
 * split as `rate-limit/window.ts` and `billing/complimentary.ts`.
 */

/** Qualified invites needed before a bonus is granted. */
export const INVITES_PER_REWARD = 3;

/** How long a granted bonus lasts. */
export const REWARD_DAYS = 7;

/**
 * The most bonuses one account can ever earn: four, so twenty-eight days.
 *
 * Not a fraud check — the filters in `countQualified` do that work: a confirmed
 * address, one mailbox counted once, and a journalled trade. This is the bound
 * that makes whatever fraud survives them not worth committing. Somebody willing
 * to run real mailboxes at real providers and trade from each can still earn
 * bonuses; with a ceiling what they can earn is finite and small, and the
 * arithmetic stops rewarding the effort long before it costs anything that
 * matters.
 */
export const MAX_REWARDS = 4;

/**
 * How many bonuses a number of qualified invites is worth, capped.
 *
 * Pure and tested, so the ceiling is a fact about the programme rather than a
 * loop bound nobody reads.
 */
export function rewardsEarned(qualified: number): number {
  if (!Number.isFinite(qualified) || qualified < 0) return 0;

  return Math.min(Math.floor(qualified / INVITES_PER_REWARD), MAX_REWARDS);
}
