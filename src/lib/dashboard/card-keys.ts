/**
 * The reorderable cards on the dashboard, in their default order.
 *
 * A fixed list rather than deriving keys from what happens to render: the
 * saved order in `DashboardLayout` has to keep meaning something even on a
 * visit where, say, the curve is absent because there are not yet two closed
 * trades. `resolveOrder` is what reconciles a saved order against whichever
 * of these keys are actually present today.
 */
export const DASHBOARD_CARD_KEYS = [
  "chart",
  "brief",
  "watchlist",
  "open_positions",
  "risk_exposure",
  "recent_trades",
  "pnl_curve",
  "pnl_distribution",
  "performance",
] as const;

export type DashboardCardKey = (typeof DASHBOARD_CARD_KEYS)[number];

function isCardKey(value: string): value is DashboardCardKey {
  return (DASHBOARD_CARD_KEYS as readonly string[]).includes(value);
}

/**
 * A saved order, reconciled against the cards actually present on this visit.
 *
 * Three things a saved order cannot be trusted to get right on its own: it
 * may name a key from before this release, a key for a card that is not
 * rendering today (no curve yet), or be missing a key added since it was
 * saved. Unknown keys are dropped, present-but-unlisted keys are appended in
 * their default position, so a new card is never accidentally hidden by an
 * old save.
 */
export function resolveOrder(
  saved: string[],
  present: DashboardCardKey[],
): DashboardCardKey[] {
  const presentSet = new Set(present);
  const ordered = saved.filter(isCardKey).filter((key) => presentSet.has(key));

  const seen = new Set(ordered);
  const remaining = present.filter((key) => !seen.has(key));

  return [...ordered, ...remaining];
}
