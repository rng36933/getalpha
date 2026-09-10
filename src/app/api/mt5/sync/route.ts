import { TradeSource } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { applySync, type IncomingTrade } from "@/lib/mt5/sync";
import { hashToken, tokenFromHeader } from "@/lib/mt5/token";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { requireJsonRequest } from "@/lib/request-guards";

/**
 * A response with an explicit Content-Length instead of Vercel's default
 * chunked transfer-encoding.
 *
 * MetaTrader's WebRequest (WinINet under the hood) was observed hanging for a
 * full client-side timeout on this endpoint even though the server answered
 * within a second every time — confirmed by comparing this route's own
 * runtime logs against the EA's journal timestamps. A response with no
 * Content-Length depends on the client correctly recognising the final
 * zero-length chunk to know the body is complete; if that recognition
 * doesn't happen, the client sits waiting for more bytes that already
 * arrived. A fixed Content-Length removes that ambiguity entirely.
 */
function jsonFixedLength(body: unknown, status: number): Response {
  const text = JSON.stringify(body);
  return new Response(text, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": String(Buffer.byteLength(text, "utf8")),
    },
  });
}

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
    return jsonFixedLength({ error: "Missing connection token" }, 401);
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
    return jsonFixedLength({ error: "Unknown connection token" }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonFixedLength({ error: "Request body must be valid JSON" }, 400);
  }

  const payload = body as {
    account?: unknown;
    broker?: unknown;
    currency?: unknown;
    trades?: unknown;
  };

  if (!Array.isArray(payload.trades)) {
    return jsonFixedLength({ error: "trades: required, must be an array" }, 400);
  }

  if (payload.trades.length > MAX_TRADES) {
    return jsonFixedLength({ error: `Send at most ${MAX_TRADES} trades per request` }, 413);
  }

  const asText = (value: unknown): string | null =>
    typeof value === "string" && value.trim() !== "" ? value.trim().slice(0, 64) : null;

  try {
    const result = await applySync(
      connection.userId,
      payload.trades as IncomingTrade[],
      TradeSource.MT5,
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

    return jsonFixedLength({ ok: true, ...result }, 200);
  } catch (error) {
    console.error("POST /api/mt5/sync failed:", error);
    return jsonFixedLength({ error: "Could not store the trades" }, 500);
  }
}
