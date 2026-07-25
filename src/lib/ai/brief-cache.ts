import { Prisma } from "@/generated/prisma/client";
import type { SessionBriefCache, TradingSession } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { AiUsage, SessionBrief } from "./types";

/** How long a stored brief is served before a fresh one is generated. */
export const BRIEF_TTL_MS = 4 * 60 * 60 * 1000;

/**
 * How long a claim is honoured before another request may take it over.
 *
 * Without this, a generator that crashes mid-call would leave the row PENDING
 * for the rest of the day and nobody would ever produce a brief again.
 */
const CLAIM_TIMEOUT_MS = 3 * 60 * 1000;

/** UTC calendar day, as YYYY-MM-DD. */
export function utcDateKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export type CachedBrief = {
  brief: SessionBrief;
  generatedAt: Date;
  ageMs: number;
  stale: boolean;
  /** Whether any market data source was stale or missing when it was written. */
  degraded: boolean;
};

function toCached(row: SessionBriefCache, now: Date): CachedBrief | null {
  if (row.status !== "READY" || row.brief === null || row.generatedAt === null) {
    return null;
  }

  const ageMs = now.getTime() - row.generatedAt.getTime();

  return {
    brief: row.brief as unknown as SessionBrief,
    generatedAt: row.generatedAt,
    ageMs,
    stale: ageMs > BRIEF_TTL_MS,
    degraded: row.degraded,
  };
}

/** The stored brief for today's session, fresh or not. Null if there is none. */
export async function readBrief(
  session: TradingSession,
  now: Date = new Date(),
): Promise<CachedBrief | null> {
  const row = await prisma.sessionBriefCache.findUnique({
    where: { session_briefDate: { session, briefDate: utcDateKey(now) } },
  });

  return row === null ? null : toCached(row, now);
}

/**
 * Takes ownership of generating this session's brief, or reports that someone
 * else already has it.
 *
 * One statement, and every timestamp comes from `now()` — the database clock.
 * Two properties follow from that, and both matter:
 *
 * - There is no read-then-write window for a second caller to slip through.
 *   The conditional ON CONFLICT DO UPDATE either claims the row or does not.
 * - Application clocks never enter the comparison. Each serverless invocation
 *   runs on its own machine with its own clock; comparing one instance's idea
 *   of "now" against a timestamp another instance wrote makes a fresh claim
 *   look abandoned whenever the two drift apart.
 */
export async function claimBriefGeneration(
  session: TradingSession,
  now: Date = new Date(),
): Promise<{ won: boolean }> {
  const briefDate = utcDateKey(now);
  const ttlSeconds = Math.round(BRIEF_TTL_MS / 1000);
  const claimTimeoutSeconds = Math.round(CLAIM_TIMEOUT_MS / 1000);

  const affected = await prisma.$executeRaw`
    INSERT INTO "SessionBriefCache"
      (id, session, "briefDate", status, "claimedAt", "createdAt", "updatedAt")
    VALUES
      (gen_random_uuid()::text, ${session}::"TradingSession", ${briefDate},
       'PENDING', now(), now(), now())
    ON CONFLICT (session, "briefDate") DO UPDATE
      SET status = 'PENDING', "claimedAt" = now(), "updatedAt" = now()
      WHERE
        -- the stored brief has aged out
        ("SessionBriefCache".status = 'READY'
           AND "SessionBriefCache"."generatedAt"
               < now() - make_interval(secs => ${ttlSeconds}))
        -- a previous attempt failed
        OR "SessionBriefCache".status = 'FAILED'
        -- a generator claimed it and never came back
        OR ("SessionBriefCache".status = 'PENDING'
           AND "SessionBriefCache"."claimedAt"
               < now() - make_interval(secs => ${claimTimeoutSeconds}))
  `;

  return { won: affected === 1 };
}

/** Stores a completed brief and releases the claim. */
export async function storeBrief(
  session: TradingSession,
  brief: SessionBrief,
  inputs: unknown,
  degraded: boolean,
  usage: AiUsage & { costUsd: number },
  now: Date = new Date(),
): Promise<void> {
  await prisma.sessionBriefCache.update({
    where: { session_briefDate: { session, briefDate: utcDateKey(now) } },
    data: {
      status: "READY",
      brief: brief as unknown as Prisma.InputJsonValue,
      inputs: inputs as Prisma.InputJsonValue,
      degraded,
      generatedAt: now,
      model: usage.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      costUsd: new Prisma.Decimal(usage.costUsd.toFixed(6)),
    },
  });
}

/**
 * Releases a failed claim so the next request can retry immediately instead of
 * waiting out the claim timeout.
 */
export async function releaseFailedClaim(
  session: TradingSession,
  now: Date = new Date(),
): Promise<void> {
  try {
    await prisma.sessionBriefCache.updateMany({
      where: { session, briefDate: utcDateKey(now), status: "PENDING" },
      data: { status: "FAILED" },
    });
  } catch (error) {
    // Never mask the original failure with a bookkeeping one.
    console.error("Failed to release the session brief claim:", error);
  }
}
