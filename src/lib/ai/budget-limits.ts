/**
 * The two spending ceilings, and which calls each one governs.
 *
 * Its own module with no imports so `npm test` can reach it: `budget.ts` pulls
 * in the Prisma client, and the bare node test runner resolves neither that nor
 * the `@/` alias. Same split as `rate-limit/window.ts`.
 */

/** The whole application, per UTC day. */
export const DEFAULT_DAILY_BUDGET_USD = 2;

/**
 * One account, per UTC day. Fifty cents.
 *
 * Derived from what an account is worth rather than picked to look tidy. Pro is
 * €19.99 a month, roughly $0.72 a day of revenue, and a Coach review costs
 * about $0.09 — so this is five or six reviews a day, every day, and a user who
 * sits at the ceiling permanently is still gross-margin positive. It is also far
 * more reviewing than a person actually does: five trades reviewed in one day is
 * a heavy session, not a normal one.
 *
 * The point is not to protect the bill — the application-wide cap already does
 * that absolutely. It is that without a per-account ceiling, one enthusiast
 * drains the day's pot and a paying customer gets a 402 for the thing they
 * bought. The limit existed; it was pointed the wrong way.
 */
export const DEFAULT_PER_USER_BUDGET_USD = 0.5;

/**
 * Reads a dollar amount from an environment variable.
 *
 * A malformed value falls back and says so rather than throwing: a typo in an
 * env var should not take the AI modules offline, and it should not silently
 * become zero either — zero would read as "refuse everything", which is a very
 * confusing way for a spending limit to fail.
 */
export function readBudgetUsd(
  raw: string | undefined,
  fallback: number,
  name: string,
): number {
  if (raw === undefined || raw.trim() === "") return fallback;

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed < 0) {
    console.warn(`${name}="${raw}" is not a valid amount — using $${fallback}.`);
    return fallback;
  }

  return parsed;
}

export function dailyBudgetUsd(): number {
  return readBudgetUsd(
    process.env.AI_DAILY_BUDGET_USD,
    DEFAULT_DAILY_BUDGET_USD,
    "AI_DAILY_BUDGET_USD",
  );
}

/**
 * A higher ceiling for specific accounts, the same shape as `PRO_USER_IDS`.
 *
 * Built for the operator and anyone else testing the product against their own
 * usage rather than a customer's — a $0.50 cap sized around what one paying
 * subscriber can be trusted to run without the app losing money on them is the
 * wrong number for somebody deliberately exercising the Coach ten times in an
 * afternoon. Configuration rather than a code change: naming an id here does
 * not touch what every other account is held to, and removing it revokes the
 * higher ceiling on the next deploy with nothing else to clean up.
 */
export function highBudgetUserIds(
  raw: string | undefined = process.env.AI_HIGH_BUDGET_USER_IDS,
): string[] {
  return (raw ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id !== "");
}

/**
 * The raised ceiling itself, applied only to `highBudgetUserIds()`.
 *
 * Raising this alone is not enough on its own to unblock a lot of testing: the
 * application-wide `dailyBudgetUsd()` (default $2) is checked first, inside
 * the same reservation, and it applies to every account combined regardless of
 * this override. A per-user cap higher than what is left in the whole day's
 * budget still gets refused with `scope: "GLOBAL"` — raising `AI_DAILY_BUDGET_USD`
 * too is part of actually getting the extra headroom this exists to grant.
 */
export const DEFAULT_HIGH_PER_USER_BUDGET_USD = 5;

function highPerUserDailyBudgetUsd(): number {
  return readBudgetUsd(
    process.env.AI_HIGH_DAILY_BUDGET_PER_USER_USD,
    DEFAULT_HIGH_PER_USER_BUDGET_USD,
    "AI_HIGH_DAILY_BUDGET_PER_USER_USD",
  );
}

/**
 * The daily ceiling this account is held to.
 *
 * `userId` is optional and defaults to nobody matching the raised list, so
 * every existing call site that does not pass one keeps the ordinary $0.50
 * cap rather than silently gaining a higher one.
 */
export function perUserDailyBudgetUsd(userId: string | null = null): number {
  if (userId !== null && highBudgetUserIds().includes(userId)) {
    return highPerUserDailyBudgetUsd();
  }

  return readBudgetUsd(
    process.env.AI_DAILY_BUDGET_PER_USER_USD,
    DEFAULT_PER_USER_BUDGET_USD,
    "AI_DAILY_BUDGET_PER_USER_USD",
  );
}

/**
 * Whether a feature's cost belongs to one account.
 *
 * Only the Coach does. The Session Brief is a single shared document — one call
 * serves every user for four hours — so charging it to whoever happened to open
 * the page first would bill one person for everybody else's reading, and lock
 * out the unlucky first visitor of each window. It needs no per-account ceiling
 * anyway: its own cache bounds it at three sessions times six windows a day,
 * whether one person is using the desk or a thousand.
 */
export function isPerUserCapped(feature: string): boolean {
  return feature === "TRADE_COACH";
}
