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
import { track } from "@/lib/analytics";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import type { TradingSession } from "@/lib/ai/types";
import { requireJsonRequest } from "@/lib/request-guards";
import { resolveBriefAudience } from "@/lib/market-data/brief-audience";
import {
  collectMarketSnapshot,
  isSnapshotEmpty,
  toBriefInput,
  toSourceReport,
} from "@/lib/market-data/snapshot";

const SESSIONS: TradingSession[] = ["LONDON", "NEW_YORK", "ASIA"];

/**
 * Collecting three providers and then generating takes most of a minute on a
 * cold cache. Vercel's default ceiling is 60s; set explicitly so the margin is
 * a decision rather than a default nobody looked at.
 */
export const maxDuration = 60;

/**
 * POST /api/ai/session-brief
 *
 * Body: { session }
 *
 * The market data is collected server-side, not supplied by the caller. Briefs
 * are shared between readers watching the same instruments, so a payload from
 * whichever user happened to ask first would end up in the others' brief.
 *
 * Not gated on the paid plan. The plan decides *what the brief covers*, not
 * whether it exists: a Free reader gets gold, a Pro reader gets their own
 * watchlist. That check lives in `resolveBriefAudience`, and it protects the
 * paid content structurally rather than by a guard that could be forgotten —
 * a Free reader's key is derived from the gold set, so the multi-instrument
 * row is not something they can look up, mistake or otherwise.
 *
 * Giving the free tier one shared gold brief costs a fixed amount per day no
 * matter how many free accounts read it, which is the same argument that made
 * this document shared in the first place.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const limited = enforceRateLimit(`ai:${userId}`, LIMITS.ai);
  if (limited) return limited;

  const wrongType = requireJsonRequest(request);
  if (wrongType) return wrongType;

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

  // Which instruments this reader's brief covers, and the row it lives in.
  // Derived from their plan and their own watchlist — never from the request.
  const audience = await resolveBriefAudience(userId);
  const { key, symbols, personalised, truncated } = audience;

  // Named on every response, including the cached ones. A reader looking at a
  // brief needs to know what it is about; the panel used to state the covered
  // instruments from a hardcoded list, which is exactly the kind of copy that
  // goes quietly wrong the moment the data behind it becomes per-user.
  const coverage = {
    instruments: symbols.map((entry) => entry.label),
    personalised,
    truncated,
  };

  // 1. Someone watching the same instruments generated this recently.
  const cached = await readBrief(key, tradingSession, now);
  if (cached && !cached.stale) {
    track("ai_brief_requested", userId, {
      session: tradingSession,
      cacheHit: true,
      degraded: cached.degraded,
    });

    return NextResponse.json({
      brief: cached.brief,
      cached: true,
      degraded: cached.degraded,
      generatedAt: cached.generatedAt.toISOString(),
      ageSeconds: Math.round(cached.ageMs / 1000),
      ...coverage,
    });
  }

  // 2. Take ownership, or discover that another request already has it.
  const { won } = await claimBriefGeneration(key, tradingSession, now);

  if (!won) {
    // Serving a slightly stale brief beats making the user wait for a call
    // somebody else is already paying for.
    if (cached) {
      track("ai_brief_requested", userId, {
        session: tradingSession,
        cacheHit: true,
        degraded: cached.degraded,
      });

      return NextResponse.json({
        brief: cached.brief,
        cached: true,
        stale: true,
        degraded: cached.degraded,
        generatedAt: cached.generatedAt.toISOString(),
        ageSeconds: Math.round(cached.ageMs / 1000),
        ...coverage,
      });
    }

    return NextResponse.json(
      { status: "generating", retryAfterSeconds: 15, ...coverage },
      { status: 202, headers: { "retry-after": "15" } },
    );
  }

  try {
    const snapshot = await collectMarketSnapshot(tradingSession, symbols, now);

    // Nothing was collected from any provider. A brief written from nothing
    // could only be invention, so refuse rather than pay for one.
    if (isSnapshotEmpty(snapshot)) {
      await releaseFailedClaim(key, tradingSession, now);
      return NextResponse.json(
        {
          error: "No market data available",
          ...toSourceReport(snapshot),
          ...coverage,
        },
        { status: 503 },
      );
    }

    const input = toBriefInput(snapshot);
    const { data, usage } = await generateSessionBrief(input, userId);

    await storeBrief(
      key,
      tradingSession,
      data,
      input,
      snapshot.degraded,
      usage,
      new Date(),
    );

    // Only the paths that actually return a brief are counted. A 202 while
    // somebody else generates is not a brief the user received; they retry,
    // and that attempt is the one recorded.
    track("ai_brief_requested", userId, {
      session: tradingSession,
      cacheHit: false,
      degraded: snapshot.degraded,
    });

    return NextResponse.json({
      brief: data,
      cached: false,
      usage,
      ...toSourceReport(snapshot),
      ...coverage,
    });
  } catch (error) {
    // Release the claim so the next request retries rather than waiting out
    // the claim timeout.
    await releaseFailedClaim(key, tradingSession, now);
    return aiErrorResponse(error, "POST /api/ai/session-brief");
  }
}
