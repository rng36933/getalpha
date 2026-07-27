import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applySync, type IncomingTrade } from "@/lib/mt5/sync";
import { hashToken, tokenFromHeader } from "@/lib/mt5/token";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { requireJsonRequest } from "@/lib/request-guards";

/**
 * A terminal sending more than this in one call is not a person trading.
 *
 * Raised from 500, which was too low for the one send that legitimately is
 * large: the first run ships ninety days of history in a single request, and an
 * active trader clears five hundred trades in that window without being at all
 * unusual. The failure mode was also worse than it looks — the request is
 * rejected whole, and the open positions travelling in the same payload go with
 * it, so the symptom is a desk showing nothing open rather than a truncated
 * history.
 *
 * Two thousand trades at roughly 250 bytes each is about half a megabyte, well
 * inside the platform's body limit. Past that the sender really is something
 * other than one person's terminal.
 */
const MAX_TRADES = 2000;

/**
 * POST /api/mt5/sync
 *
 * Called by the Expert Advisor running in somebody's MetaTrader terminal, with
 * their connection token as a bearer credential. Public in the middleware,
 * because a terminal has no Clerk session; the token is what authenticates it.
 *
 * The direction of travel is the point: the terminal sends to us and we never
 * connect to it. Nothing stored here could be used to reach anybody's broker.
 */
export async function POST(request: Request) {
  const token = tokenFromHeader(request.headers.get("authorization"));

  if (!token) {
    return NextResponse.json({ error: "Missing connection token" }, { status: 401 });
  }

  const wrongType = requireJsonRequest(request);
  if (wrongType) return wrongType;

  // Keyed on the token so one terminal cannot exhaust another's allowance, and
  // on its hash so the raw token never reaches the in-memory map.
  const tokenHash = hashToken(token);

  const limited = enforceRateLimit(`mt5:${tokenHash}`, LIMITS.write);
  if (limited) return limited;

  const connection = await prisma.mtConnection
    .findUnique({ where: { tokenHash }, select: { id: true, userId: true } })
    .catch((error) => {
      console.error("MT5 sync could not read the connection:", error);
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
    console.error("POST /api/mt5/sync failed:", error);
    return NextResponse.json({ error: "Could not store the trades" }, { status: 500 });
  }
}
