/**
 * Accounts handed the paid modules outright, by Clerk user id.
 *
 * `PRO_USER_IDS`, comma-separated — the same shape as
 * `SUPPORT_ADMIN_USER_IDS`, and for the same reason: an entitlement granted by
 * hand belongs in configuration rather than in a table somebody has to remember
 * to clean up. Taking an id out of the list revokes it on the next deploy, with
 * no Stripe subscription to cancel and no refund to reason about.
 *
 * Ids, never email addresses. Whoever owns an account can change its email; the
 * Clerk id cannot be changed, which is what makes it safe to grant against.
 *
 * Its own module rather than part of `subscription.ts` so `npm test` can reach
 * it: that file imports the Prisma client and the Stripe SDK, and the bare node
 * test runner resolves neither the `@/` alias nor those packages' side effects.
 * Same split as `rate-limit/window.ts` and `referral/email-check.ts`.
 */
export function hasComplimentaryAccess(
  userId: string | null,
  raw: string | undefined = process.env.PRO_USER_IDS,
): boolean {
  if (!userId) return false;

  return (raw ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id !== "")
    .includes(userId);
}
