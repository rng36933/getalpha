import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyTradingViewEvent, type TradingViewEvent } from "@/lib/tradingview/sync";
import { hashToken } from "@/lib/mt5/token";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/tradingview/sync/[token]
 *
 * The token lives in the URL, not an Authorization header — TradingView's
 * alert webhook has exactly one field, a URL, and no way to attach a custom
 * header. See /api/tradingview/connection for where this URL is issued.
 *
 * The body is read as text and parsed by hand rather than gated behind
 * `requireJsonRequest` (see request-guards.ts): TradingView does not offer
 * a Content-Type control in its alert UI and reliably sends
 * `text/plain;charset=UTF-8` even when the message is JSON. That guard exists
 * to close a cookie-based CSRF gap, which does not apply here — this route
 * has no session to forge in the first place, only a bearer secret in the URL.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: "Missing connection token" }, { status: 401 });
  }

  const tokenHash = hashToken(token);

  const limited = enforceRateLimit(`tradingview:${tokenHash}`, LIMITS.write);
  if (limited) return limited;

  const connection = await prisma.mtConnection
    .findUnique({ where: { tokenHash }, select: { id: true, userId: true } })
    .catch((error) => {
      console.error("TradingView sync could not read the connection:", error);
      return null;
    });

  if (!connection) {
    return NextResponse.json({ error: "Unknown connection token" }, { status: 401 });
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ error: "Could not read the request body" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Body must be JSON — check the alert message template" },
      { status: 400 },
    );
  }

  const payload = body as Partial<TradingViewEvent>;

  if (
    typeof payload.symbol !== "string" ||
    typeof payload.action !== "string" ||
    typeof payload.price !== "number" ||
    typeof payload.contracts !== "number" ||
    typeof payload.positionSize !== "number" ||
    typeof payload.time !== "string"
  ) {
    return NextResponse.json(
      {
        error:
          "Expected symbol, action, price, contracts, positionSize, time — check the alert message template",
      },
      { status: 400 },
    );
  }

  try {
    const result = await applyTradingViewEvent(connection.userId, {
      symbol: payload.symbol,
      action: payload.action,
      price: payload.price,
      contracts: payload.contracts,
      positionSize: payload.positionSize,
      time: payload.time,
      id: typeof payload.id === "string" && payload.id.trim() !== "" ? payload.id.trim().slice(0, 64) : null,
      comment:
        typeof payload.comment === "string" && payload.comment.trim() !== ""
          ? payload.comment.trim().slice(0, 64)
          : null,
    });

    await prisma.mtConnection.update({
      where: { id: connection.id },
      data: { lastSeenAt: new Date() },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("POST /api/tradingview/sync failed:", error);
    return NextResponse.json({ error: "Could not store the trade" }, { status: 500 });
  }
}
