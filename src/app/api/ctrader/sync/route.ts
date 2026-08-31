import { NextResponse } from "next/server";
import { TradeSource } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { applySync, type IncomingTrade } from "@/lib/mt5/sync";
import { hashToken, tokenFromHeader } from "@/lib/mt5/token";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { requireJsonRequest } from "@/lib/request-guards";

/**
 * The cTrader twin of /api/mt5/sync — same payload shape, same `applySync`
 * pipeline, just tagged `TradeSource.CTRADER` on the way in. cTrader's cBot
 * has real Positions/History like a MetaTrader terminal does, so this is a
 * full snapshot resend on a timer, not TradingView's event-log model.
 */
const MAX_TRADES = 2000;

/**
 * POST /api/ctrader/sync
 *
 * Called by the cBot running in somebody's cTrader account, with their
 * connection token as a bearer credential. Public in the middleware, because
 * a cBot has no Clerk session; the token is what authenticates it.
 */
export async function POST(request: Request) {
  const token = tokenFromHeader(request.headers.get("authorization"));

  if (!token) {
    return NextResponse.json({ error: "Missing connection token" }, { status: 401 });
  }

  const wrongType = requireJsonRequest(request);
  if (wrongType) return wrongType;

  const tokenHash = hashToken(token);

  const limited = enforceRateLimit(`ctrader:${tokenHash}`, LIMITS.write);
  if (limited) return limited;

  const connection = await prisma.mtConnection
    .findUnique({ where: { tokenHash }, select: { id: true, userId: true } })
    .catch((error) => {
      console.error("cTrader sync could not read the connection:", error);
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
      TradeSource.CTRADER,
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
    console.error("POST /api/ctrader/sync failed:", error);
    return NextResponse.json({ error: "Could not store the trades" }, { status: 500 });
  }
}
