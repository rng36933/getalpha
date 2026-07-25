import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  claimBriefGeneration,
  readBrief,
  releaseFailedClaim,
  storeBrief,
} from "@/lib/ai/brief-cache";
import { generateSessionBrief } from "@/lib/ai/session-brief";
import {
  aiErrorResponse,
  badRequest,
  isRecord,
  requireArray,
} from "@/lib/ai/http";
import type {
  CalendarInput,
  NewsInput,
  SessionBriefInput,
  TechnicalLevelsInput,
  TradingSession,
} from "@/lib/ai/types";

const SESSIONS: TradingSession[] = ["LONDON", "NEW_YORK", "ASIA"];
const IMPACTS = ["HIGH", "MEDIUM", "LOW"];

/**
 * POST /api/ai/session-brief
 *
 * Body: { session, economicEvents[], technicalLevels[], newsHeadlines[] }
 * Returns the three-point desk brief plus the token usage of the call.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

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

  const errors: string[] = [];

  const session = body.session;
  if (typeof session !== "string" || !SESSIONS.includes(session as TradingSession)) {
    errors.push(`session: must be one of ${SESSIONS.join(", ")}`);
  }

  const rawEvents = requireArray(body.economicEvents, "economicEvents", errors);
  const rawLevels = requireArray(body.technicalLevels, "technicalLevels", errors);
  const rawNews = requireArray(body.newsHeadlines, "newsHeadlines", errors);

  const economicEvents = rawEvents.map((item, i) =>
    parseEvent(item, `economicEvents[${i}]`, errors),
  );
  const technicalLevels = rawLevels.map((item, i) =>
    parseLevels(item, `technicalLevels[${i}]`, errors),
  );
  const newsHeadlines = rawNews.map((item, i) =>
    parseNews(item, `newsHeadlines[${i}]`, errors),
  );

  // A brief assembled from nothing would be pure invention — refuse it here
  // rather than paying for a call that can only produce filler.
  if (
    errors.length === 0 &&
    economicEvents.length === 0 &&
    technicalLevels.length === 0 &&
    newsHeadlines.length === 0
  ) {
    errors.push(
      "at least one of economicEvents, technicalLevels or newsHeadlines must be non-empty",
    );
  }

  if (errors.length > 0) return badRequest(errors);

  const tradingSession = session as TradingSession;
  const now = new Date();

  // 1. Someone already generated this session's brief recently.
  const cached = await readBrief(tradingSession, now);
  if (cached && !cached.stale) {
    return NextResponse.json({
      brief: cached.brief,
      cached: true,
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
        generatedAt: cached.generatedAt.toISOString(),
        ageSeconds: Math.round(cached.ageMs / 1000),
      });
    }

    return NextResponse.json(
      { status: "generating", retryAfterSeconds: 15 },
      { status: 202, headers: { "retry-after": "15" } },
    );
  }

  const input: SessionBriefInput = {
    session: tradingSession,
    asOf: now.toISOString(),
    economicEvents,
    technicalLevels,
    newsHeadlines,
  };

  try {
    const { data, usage } = await generateSessionBrief(input, userId);
    await storeBrief(tradingSession, data, usage, new Date());

    return NextResponse.json({ brief: data, cached: false, usage });
  } catch (error) {
    // Release the claim so the next request retries rather than waiting out
    // the claim timeout.
    await releaseFailedClaim(tradingSession, now);
    return aiErrorResponse(error, "POST /api/ai/session-brief");
  }
}

function parseEvent(
  value: unknown,
  path: string,
  errors: string[],
): CalendarInput {
  if (!isRecord(value)) {
    errors.push(`${path}: must be an object`);
    return blankEvent();
  }

  const impact = value.impact;
  if (typeof impact !== "string" || !IMPACTS.includes(impact)) {
    errors.push(`${path}.impact: must be one of ${IMPACTS.join(", ")}`);
  }

  return {
    time: str(value.time, `${path}.time`, errors),
    currency: str(value.currency, `${path}.currency`, errors),
    title: str(value.title, `${path}.title`, errors),
    impact: (impact ?? "LOW") as CalendarInput["impact"],
    actual: optionalStr(value.actual),
    forecast: optionalStr(value.forecast),
    previous: optionalStr(value.previous),
  };
}

function parseLevels(
  value: unknown,
  path: string,
  errors: string[],
): TechnicalLevelsInput {
  if (!isRecord(value)) {
    errors.push(`${path}: must be an object`);
    return { symbol: "", timeframe: "", lastPrice: 0, support: [], resistance: [] };
  }

  return {
    symbol: str(value.symbol, `${path}.symbol`, errors),
    timeframe: str(value.timeframe, `${path}.timeframe`, errors),
    lastPrice: num(value.lastPrice, `${path}.lastPrice`, errors),
    support: numArray(value.support, `${path}.support`, errors),
    resistance: numArray(value.resistance, `${path}.resistance`, errors),
  };
}

function parseNews(value: unknown, path: string, errors: string[]): NewsInput {
  if (!isRecord(value)) {
    errors.push(`${path}: must be an object`);
    return { title: "", source: "", publishedAt: "", summary: null };
  }

  return {
    title: str(value.title, `${path}.title`, errors),
    source: str(value.source, `${path}.source`, errors),
    publishedAt: str(value.publishedAt, `${path}.publishedAt`, errors),
    summary: optionalStr(value.summary),
  };
}

function blankEvent(): CalendarInput {
  return {
    time: "",
    currency: "",
    title: "",
    impact: "LOW",
    actual: null,
    forecast: null,
    previous: null,
  };
}

function str(value: unknown, path: string, errors: string[]): string {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${path}: required, must be a non-empty string`);
    return "";
  }
  return value.trim();
}

function optionalStr(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function num(value: unknown, path: string, errors: string[]): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push(`${path}: required, must be a finite number`);
    return 0;
  }
  return value;
}

function numArray(value: unknown, path: string, errors: string[]): number[] {
  if (!Array.isArray(value)) {
    errors.push(`${path}: must be an array of numbers`);
    return [];
  }

  const parsed: number[] = [];
  value.forEach((entry, i) => {
    if (typeof entry !== "number" || !Number.isFinite(entry)) {
      errors.push(`${path}[${i}]: must be a finite number`);
      return;
    }
    parsed.push(entry);
  });

  return parsed;
}
