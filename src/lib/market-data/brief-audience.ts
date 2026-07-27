import { checkAccess } from "@/lib/billing/subscription";
import { prisma } from "@/lib/prisma";
import { defaultAudience, watchlistKey, type BriefAudience } from "./brief-symbols";
import { WATCHLIST_LIMIT } from "./types";

export { defaultAudience, watchlistKey };
export type { BriefAudience };

/**
 * Which instruments this user's brief covers, and the cache row it belongs in.
 *
 * The plan decides, and it decides through `checkAccess` — the same function
 * every other paid surface reads, so a comped account or a referral reward gets
 * a personalised brief without any of this knowing those exist.
 *
 * A Free reader is not refused; they get gold. That is the shape of the
 * feature: the module is visible to everyone, and what Pro buys is having it
 * describe *your* instruments rather than the house default. The paid content
 * is protected structurally rather than by a guard — a Free reader's cache key
 * is derived from the gold set, so a multi-instrument brief is not a row they
 * can look up by any route.
 *
 * Reads the watchlist directly rather than through `getWatchlist`, because that
 * helper seeds a default list as a side effect of being asked. Generating a
 * brief must not write instruments into somebody's account.
 *
 * Capped at `WATCHLIST_LIMIT`: a watchlist may hold twenty instruments
 * (`MAX_WATCHLIST_SIZE`) but one provider request may ask for eight, and a
 * ninth fails the whole request rather than itself.
 */
export async function resolveBriefAudience(
  userId: string,
): Promise<BriefAudience> {
  const access = await checkAccess(userId);
  if (!access.allowed) return defaultAudience();

  // One more than the cap, purely to learn whether there was a ninth. The row
  // is discarded; without asking for it there is no way to distinguish a
  // watchlist of exactly eight from one of twenty, and the panel would claim to
  // cover a list it had silently cut down.
  const rows = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: WATCHLIST_LIMIT + 1,
    include: { instrument: { select: { symbol: true, label: true } } },
  });

  // An entitled reader who has never opened the watchlist has no rows yet. Gold
  // is the right answer rather than an empty brief, and it costs them nothing:
  // they land in the same shared document as everyone else until they choose.
  if (rows.length === 0) return defaultAudience();

  const symbols = rows.slice(0, WATCHLIST_LIMIT).map((row) => ({
    symbol: row.instrument.symbol,
    label: row.instrument.label,
  }));

  return {
    symbols,
    key: watchlistKey(symbols),
    personalised: true,
    truncated: rows.length > WATCHLIST_LIMIT,
  };
}
