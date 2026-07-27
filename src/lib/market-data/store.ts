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
 * The newest stored row for each of several keys, in one round trip.
 *
 * `recallSnapshot` answers for one key, and asking it eight times while
 * building a brief would put eight queries on the request path. `DISTINCT ON`
 * is Postgres doing the "newest per group" reduction where the index already
 * is — `@@index([kind, key, fetchedAt])` serves the whole statement.
 *
 * Keys absent from the result have nothing recent enough; the caller decides
 * whether that means fetch or give up.
 */
export async function recallNewestByKey<T>(
  kind: MarketDataKind,
  keys: string[],
  maxAgeMs: number = MAX_FALLBACK_AGE_MS,
): Promise<Map<string, { data: T; fetchedAt: Date }>> {
  const out = new Map<string, { data: T; fetchedAt: Date }>();
  if (keys.length === 0) return out;

  try {
    const rows = await prisma.$queryRaw<
      { key: string; payload: T; fetchedAt: Date }[]
    >`
      SELECT DISTINCT ON (key) key, payload, "fetchedAt"
      FROM "MarketDataSnapshot"
      WHERE kind = ${kind}::"MarketDataKind"
        AND key = ANY(${keys})
        AND "fetchedAt" > ${new Date(Date.now() - maxAgeMs)}
      ORDER BY key, "fetchedAt" DESC
    `;

    for (const row of rows) {
      out.set(row.key, { data: row.payload, fetchedAt: row.fetchedAt });
    }
  } catch (error) {
    // A cache that cannot be read is a slow path, not a broken one.
    console.error(`Failed to read stored ${kind} snapshots:`, error);
  }

  return out;
}

/**
 * Drops old rows for a kind, keeping the newest few of every key.
 *
 * `pruneSnapshots` prunes one key at a time, which is the wrong shape once a
 * kind holds a row per symbol: pruning eight symbols would be eight statements
 * on a path already paying for a provider call and a model call.
 */
export async function pruneSnapshotsByKind(
  kind: MarketDataKind,
  keepPerKey = 3,
): Promise<void> {
  try {
    await prisma.$executeRaw`
      DELETE FROM "MarketDataSnapshot"
      WHERE id IN (
        SELECT id FROM (
          SELECT id, row_number() OVER (
            PARTITION BY key ORDER BY "fetchedAt" DESC
          ) AS position
          FROM "MarketDataSnapshot"
          WHERE kind = ${kind}::"MarketDataKind"
        ) ranked
        WHERE ranked.position > ${keepPerKey}
      )
    `;
  } catch (error) {
    console.error(`Failed to prune ${kind} snapshots:`, error);
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
