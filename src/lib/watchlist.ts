import { Prisma } from "@/generated/prisma/client";
import type { Instrument, InstrumentKind } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** What a new account starts with, before they change anything. */
const DEFAULT_SYMBOLS = [
  "XAU/USD",
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "BTC/USD",
] as const;

/** Keeps one user's list from growing into a rate-limit problem later. */
export const MAX_WATCHLIST_SIZE = 20;

export type InstrumentResult = Pick<
  Instrument,
  "symbol" | "label" | "name" | "kind" | "group"
>;

/**
 * Instrument search, ranked so the obvious answer comes first.
 *
 * Raw SQL because the ranking is the point: an alphabetical or purely
 * popularity-ordered list puts AED/ARS above EUR/USD for the query "eur".
 * The order is exact match, then starts-with, then contains, then desk
 * popularity.
 */
export async function searchInstruments(
  query: string,
  kind: InstrumentKind | null,
  limit = 20,
): Promise<InstrumentResult[]> {
  const q = query.trim();

  if (q === "") {
    return prisma.instrument.findMany({
      where: kind ? { kind } : undefined,
      orderBy: [{ popularity: "desc" }, { symbol: "asc" }],
      take: limit,
      select: { symbol: true, label: true, name: true, kind: true, group: true },
    });
  }

  const needle = q.toUpperCase().replace(/\s+/g, "");
  const kindFilter = kind
    ? Prisma.sql`AND kind = ${kind}::"InstrumentKind"`
    : Prisma.empty;

  return prisma.$queryRaw<InstrumentResult[]>`
    SELECT symbol, label, name, kind, "group"
    FROM "Instrument"
    WHERE (
      upper(label) LIKE ${needle + "%"}
      OR upper(symbol) LIKE ${needle + "%"}
      OR upper(label) LIKE ${"%" + needle + "%"}
      OR upper(name) LIKE ${"%" + needle + "%"}
    )
    ${kindFilter}
    ORDER BY
      CASE
        WHEN upper(label) = ${needle} OR upper(symbol) = ${needle} THEN 0
        WHEN upper(label) LIKE ${needle + "%"} THEN 1
        WHEN upper(name) LIKE ${needle + "%"} THEN 2
        ELSE 3
      END,
      popularity DESC,
      symbol ASC
    LIMIT ${limit}
  `;
}

export type WatchlistEntry = InstrumentResult & { sortOrder: number };

/**
 * A user's instruments, seeded with the defaults the first time they look.
 *
 * Seeded lazily rather than on sign-up: there is no sign-up hook to hang it
 * on, and an empty first screen would be worse than a sensible one.
 */
export async function getWatchlist(userId: string): Promise<WatchlistEntry[]> {
  const existing = await readWatchlist(userId);
  if (existing.length > 0) return existing;

  await prisma.watchlistItem.createMany({
    data: DEFAULT_SYMBOLS.map((symbol, i) => ({ userId, symbol, sortOrder: i })),
    skipDuplicates: true,
  });

  return readWatchlist(userId);
}

async function readWatchlist(userId: string): Promise<WatchlistEntry[]> {
  const rows = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      instrument: {
        select: { symbol: true, label: true, name: true, kind: true, group: true },
      },
    },
  });

  return rows.map((row) => ({ ...row.instrument, sortOrder: row.sortOrder }));
}

export type AddResult =
  | { ok: true; entries: WatchlistEntry[] }
  | { ok: false; reason: "UNKNOWN_SYMBOL" | "ALREADY_PRESENT" | "LIST_FULL" };

export async function addToWatchlist(
  userId: string,
  symbol: string,
): Promise<AddResult> {
  const instrument = await prisma.instrument.findUnique({ where: { symbol } });
  if (!instrument) return { ok: false, reason: "UNKNOWN_SYMBOL" };

  const current = await readWatchlist(userId);
  if (current.some((e) => e.symbol === symbol)) {
    return { ok: false, reason: "ALREADY_PRESENT" };
  }
  if (current.length >= MAX_WATCHLIST_SIZE) {
    return { ok: false, reason: "LIST_FULL" };
  }

  await prisma.watchlistItem.create({
    data: { userId, symbol, sortOrder: current.length },
  });

  return { ok: true, entries: await readWatchlist(userId) };
}

export async function removeFromWatchlist(
  userId: string,
  symbol: string,
): Promise<{ removed: boolean; entries: WatchlistEntry[] }> {
  const { count } = await prisma.watchlistItem.deleteMany({
    where: { userId, symbol },
  });

  return { removed: count > 0, entries: await readWatchlist(userId) };
}
