import { prisma } from "@/lib/prisma";
import { DASHBOARD_CARD_KEYS, resolveOrder, type DashboardCardKey } from "./card-keys";

/**
 * A user's saved card order, or `null` when they have never rearranged
 * anything — the caller falls back to the default order in that case.
 *
 * A missing row is not an error; it is the far more common state, since a row
 * is only written once somebody has actually dragged a card.
 */
export async function loadDashboardOrder(userId: string): Promise<string[] | null> {
  const row = await prisma.dashboardLayout.findUnique({
    where: { userId },
    select: { order: true },
  });

  return row?.order ?? null;
}

/**
 * Saves the order a user dragged their cards into.
 *
 * Filtered to known keys before it ever reaches the database: the request
 * body is client input, and a stray key saved here would sit in the row
 * forever doing nothing except being reconciled away on every future read.
 */
export async function saveDashboardOrder(
  userId: string,
  order: string[],
): Promise<void> {
  const clean = order.filter((key): key is DashboardCardKey =>
    (DASHBOARD_CARD_KEYS as readonly string[]).includes(key),
  );

  await prisma.dashboardLayout.upsert({
    where: { userId },
    create: { userId, order: clean },
    update: { order: clean },
  });
}

export { resolveOrder };
