import { prisma } from "@/lib/prisma";
import {
  DASHBOARD_CARD_KEYS,
  PAIRS_CARD_KEYS,
  SETTINGS_CARD_KEYS,
  resolveOrder,
} from "./card-keys";

/**
 * Which page a saved order belongs to.
 *
 * One `DashboardLayout` table for every draggable page — see the model's own
 * comment for why. Each page's valid keys live in `card-keys.ts`.
 */
export const LAYOUT_PAGES = {
  dashboard: DASHBOARD_CARD_KEYS,
  settings: SETTINGS_CARD_KEYS,
  pairs: PAIRS_CARD_KEYS,
} as const;

export type LayoutPage = keyof typeof LAYOUT_PAGES;

/**
 * A user's saved card order for one page, or `null` when they have never
 * rearranged anything on it — the caller falls back to the default order in
 * that case.
 *
 * A missing row is not an error; it is the far more common state, since a row
 * is only written once somebody has actually dragged a card.
 */
export async function loadOrder(
  userId: string,
  page: LayoutPage,
): Promise<string[] | null> {
  const row = await prisma.dashboardLayout.findUnique({
    where: { userId_page: { userId, page } },
    select: { order: true },
  });

  return row?.order ?? null;
}

/**
 * Saves the order a user dragged a page's cards into.
 *
 * Filtered to that page's own known keys before it ever reaches the
 * database: the request body is client input, and a stray key saved here
 * would sit in the row forever doing nothing except being reconciled away on
 * every future read.
 */
export async function saveOrder(
  userId: string,
  page: LayoutPage,
  order: string[],
): Promise<void> {
  const valid = new Set<string>(LAYOUT_PAGES[page]);
  const clean = order.filter((key) => valid.has(key));

  await prisma.dashboardLayout.upsert({
    where: { userId_page: { userId, page } },
    create: { userId, page, order: clean },
    update: { order: clean },
  });
}

export function isLayoutPage(value: string): value is LayoutPage {
  return value in LAYOUT_PAGES;
}

export { resolveOrder };
