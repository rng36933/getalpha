import { Prisma } from "@/generated/prisma/client";
import type { MarketDataKind } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** How old a stored fallback may be before it is treated as useless. */
const MAX_FALLBACK_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Records a successful fetch so a later outage has something to fall back on.
 *
 * `key` separates rows that are not interchangeable within a kind — one price
 * series per symbol. Kinds with a single set (the calendar, the news) leave it
 * null.
 *
 * Never throws: failing to save the fallback must not fail the request that
 * just succeeded in fetching live data.
 */
export async function rememberSnapshot(
  kind: MarketDataKind,
  payload: unknown,
  key: string | null = null,
): Promise<void> {
  try {
    await prisma.marketDataSnapshot.create({
      data: { kind, key, payload: payload as Prisma.InputJsonValue },
    });
  } catch (error) {
    console.error(`Failed to store the ${kind} fallback snapshot:`, error);
  }
}

/** The newest stored set for this kind, or null if there is none recent enough. */
export async function recallSnapshot<T>(
  kind: MarketDataKind,
  key: string | null = null,
): Promise<{ data: T; fetchedAt: Date } | null> {
  try {
    const row = await prisma.marketDataSnapshot.findFirst({
      where: {
        kind,
        key,
        fetchedAt: { gt: new Date(Date.now() - MAX_FALLBACK_AGE_MS) },
      },
      orderBy: { fetchedAt: "desc" },
    });

    if (!row) return null;
    return { data: row.payload as T, fetchedAt: row.fetchedAt };
  } catch (error) {
    console.error(`Failed to read the ${kind} fallback snapshot:`, error);
    return null;
  }
}

/**
 * Drops old fallback rows. Only the newest is ever read, so the rest are just
 * storage; a handful are kept for debugging a bad snapshot.
 */
export async function pruneSnapshots(
  kind: MarketDataKind,
  keep = 5,
  key: string | null = null,
): Promise<void> {
  try {
    const survivors = await prisma.marketDataSnapshot.findMany({
      where: { kind, key },
      orderBy: { fetchedAt: "desc" },
      take: keep,
      select: { id: true },
    });

    await prisma.marketDataSnapshot.deleteMany({
      where: { kind, key, id: { notIn: survivors.map((s) => s.id) } },
    });
  } catch (error) {
    console.error(`Failed to prune ${kind} snapshots:`, error);
  }
}
