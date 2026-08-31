import { NextResponse } from "next/server";
import { TradeSource } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { applySync, type IncomingTrade } from "@/lib/mt5/sync";
import { hashToken, tokenFromHeader } from "@/lib/mt5/token";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { requireJsonRequest } from "@/lib/request-guards";

/**
 * The MT4 twin of /api/mt5/sync — same payload shape, same `applySync`
 * pipeline, just tagged `TradeSource.MT4` on the way in. See that route for
 * the reasoning behind the limits and the token-based auth; nothing here
 * diverges from it except the source tag.
 */
const MAX_TRADES = 2000;

/**
 * POST /api/mt4/sync
 *
 * Called by the Expert Advisor running in somebody's MetaTrader 4 terminal,
 * with their connection token as a bearer credential. Public in the
 * middleware, because a terminal has no Clerk session; the token is what
 * authenticates it.
 */
export async function POST(request: Request) {
  const token = tokenFromHeader(request.headers.get("authorization"));

  if (!token) {
    return NextResponse.json({ error: "Missing connection token" }, { status: 401 });
  }

  const wrongType = requireJsonRequest(request);
  if (wrongType) return wrongType;

  const tokenHash = hashToken(token);

  const limited = enforceRateLimit(`mt4:${tokenHash}`, LIMITS.write);
  if (limited) return limited;

  const connection = await prisma.mtConnection
    .findUnique({ where: { tokenHash }, select: { id: true, userId: true } })
    .catch((error) => {
      console.error("MT4 sync could not read the connection:", error);
      return null;
    });

  if (!connection) {
    // The same answer as a missing token: a caller learns nothing about
    // whether a token it tried once existed.
    return NextResponse.json({ error: "Unknown connection token" }, { status: 401 });
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

  const payload = body as {
    account?: unknown;
    broker?: unknown;
    currency?: unknown;
    trades?: unknown;
  };

  if (!Array.isArray(payload.trades)) {
    return NextResponse.json(
      { error: "trades: required, must be an array" },
      { status: 400 },
    );
  }

  if (payload.trades.length > MAX_TRADES) {
    return NextResponse.json(
      { error: `Send at most ${MAX_TRADES} trades per request` },
      { status: 413 },
    );
  }

  const asText = (value: unknown): string | null =>
    typeof value === "string" && value.trim() !== "" ? value.trim().slice(0, 64) : null;

  try {
    const result = await applySync(
      connection.userId,
      payload.trades as IncomingTrade[],
      TradeSource.MT4,
    );

    await prisma.mtConnection.update({
      where: { id: connection.id },
      data: {
        lastSeenAt: new Date(),
        accountLogin: asText(payload.account),
        broker: asText(payload.broker),
        currency: asText(payload.currency),
      },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("POST /api/mt4/sync failed:", error);
    return NextResponse.json({ error: "Could not store the trades" }, { status: 500 });
  }
}
