import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  claimBriefGeneration,
  readBrief,
  releaseFailedClaim,
  storeBrief,
} from "@/lib/ai/brief-cache";
import { aiErrorResponse, badRequest, isRecord } from "@/lib/ai/http";
import { generateSessionBrief } from "@/lib/ai/session-brief";
import { requirePaidAccess } from "@/lib/billing/guard";
import type { TradingSession } from "@/lib/ai/types";
import {
  collectMarketSnapshot,
  isSnapshotEmpty,
  toBriefInput,
  toSourceReport,
} from "@/lib/market-data/snapshot";

const SESSIONS: TradingSession[] = ["LONDON", "NEW_YORK", "ASIA"];

/**
 * POST /api/ai/session-brief
 *
 * Body: { session }
 *
 * The market data is collected server-side, not supplied by the caller. Briefs
 * are shared between users, so a payload from whichever user happened to ask
 * first would end up in everybody else's brief.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Checked before the cache is read, not after: the brief is a shared document
  // and serving a cached copy to someone who has not paid gives the module away
  // for free to everyone who arrives second.
  const denied = await requirePaidAccess(userId);
  if (denied) return denied;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { error: "Request body must be a JSON object" },
      { status: 400 },
    );
  }

  const session = body.session;
  if (typeof session !== "string" || !SESSIONS.includes(session as TradingSession)) {
    return badRequest([`session: must be one of ${SESSIONS.join(", ")}`]);
  }

  const tradingSession = session as TradingSession;
  const now = new Date();

  // 1. Someone already generated this session's brief recently.
  const cached = await readBrief(tradingSession, now);
  if (cached && !cached.stale) {
    return NextResponse.json({
      brief: cached.brief,
      cached: true,
      degraded: cached.degraded,
      generatedAt: cached.generatedAt.toISOString(),
      ageSeconds: Math.round(cached.ageMs / 1000),
    });
  }

  // 2. Take ownership, or discover that another request already has it.
  const { won } = await claimBriefGeneration(tradingSession, now);

  if (!won) {
    // Serving a slightly stale brief beats making the user wait for a call
    // somebody else is already paying for.
    if (cached) {
      return NextResponse.json({
        brief: cached.brief,
        cached: true,
        stale: true,
        degraded: cached.degraded,
        generatedAt: cached.generatedAt.toISOString(),
        ageSeconds: Math.round(cached.ageMs / 1000),
      });
    }

    return NextResponse.json(
      { status: "generating", retryAfterSeconds: 15 },
      { status: 202, headers: { "retry-after": "15" } },
    );
  }

  try {
    const snapshot = await collectMarketSnapshot(tradingSession, now);

    // Nothing was collected from any provider. A brief written from nothing
    // could only be invention, so refuse rather than pay for one.
    if (isSnapshotEmpty(snapshot)) {
      await releaseFailedClaim(tradingSession, now);
      return NextResponse.json(
        {
          error: "No market data available",
          ...toSourceReport(snapshot),
        },
        { status: 503 },
      );
    }

    const input = toBriefInput(snapshot);
    const { data, usage } = await generateSessionBrief(input, userId);

    await storeBrief(tradingSession, data, input, snapshot.degraded, usage, new Date());

    return NextResponse.json({
      brief: data,
      cached: false,
      usage,
      ...toSourceReport(snapshot),
    });
  } catch (error) {
    // Release the claim so the next request retries rather than waiting out
    // the claim timeout.
    await releaseFailedClaim(tradingSession, now);
    return aiErrorResponse(error, "POST /api/ai/session-brief");
  }
}
