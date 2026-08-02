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
  "performance",
] as const;

export type DashboardCardKey = (typeof DASHBOARD_CARD_KEYS)[number];

/** The reorderable cards on Settings, in their default order. */
export const SETTINGS_CARD_KEYS = ["mt5", "email"] as const;
export type SettingsCardKey = (typeof SETTINGS_CARD_KEYS)[number];

/**
 * The reorderable cards on a Pairs page.
 *
 * Same two keys regardless of which instrument is selected — the calendar
 * card is simply absent for gold, same as `resolveOrder` handles an absent
 * card everywhere else.
 */
export const PAIRS_CARD_KEYS = ["record", "calendar"] as const;
export type PairsCardKey = (typeof PAIRS_CARD_KEYS)[number];

/**
 * A saved order, reconciled against the cards actually present on this visit.
 *
 * Three things a saved order cannot be trusted to get right on its own: it
 * may name a key from before this release, a key for a card that is not
 * rendering today (no curve yet), or be missing a key added since it was
 * saved. Unknown keys are dropped, present-but-unlisted keys are appended in
 * their default position, so a new card is never accidentally hidden by an
 * old save.
 *
 * Generic over the key type so every draggable page (dashboard, settings,
 * pairs) can reuse it against its own fixed list rather than each writing the
 * same reconciliation.
 */
export function resolveOrder<K extends string>(saved: string[], present: K[]): K[] {
  const presentSet = new Set<string>(present);
  const ordered = saved.filter((key): key is K => presentSet.has(key));

  const seen = new Set(ordered);
  const remaining = present.filter((key) => !seen.has(key));

  return [...ordered, ...remaining];
}
