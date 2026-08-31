import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { issueToken } from "@/lib/mt5/token";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";

function unauthorized() {
  return NextResponse.json({ error: "Not signed in" }, { status: 401 });
}

/**
 * POST /api/tradingview/connection
 *
 * Unlike MT5/MT4/cTrader, the token issued here is not pasted into a running
 * program's settings — it becomes part of the webhook URL a TradingView
 * alert posts to, because TradingView's alert dialog has nowhere to set a
 * custom Authorization header. The response includes the ready-to-paste URL
 * for exactly that reason.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const limited = enforceRateLimit(`tradingview-connect:${userId}`, LIMITS.write);
  if (limited) return limited;

  const { token, hash } = issueToken("TRADINGVIEW");

  try {
    await prisma.mtConnection.upsert({
      where: { userId_platform: { userId, platform: "TRADINGVIEW" } },
      create: { userId, platform: "TRADINGVIEW", tokenHash: hash },
      update: {
        tokenHash: hash,
        accountLogin: null,
        broker: null,
        currency: null,
        lastSeenAt: null,
      },
    });

    return NextResponse.json({ token }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tradingview/connection failed:", error);
    return NextResponse.json(
      { error: "Could not create a connection token" },
      { status: 500 },
    );
  }
}

/** DELETE /api/tradingview/connection — invalidates the webhook URL. */
export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    await prisma.mtConnection.deleteMany({ where: { userId, platform: "TRADINGVIEW" } });
    return NextResponse.json({ disconnected: true });
  } catch (error) {
    console.error("DELETE /api/tradingview/connection failed:", error);
    return NextResponse.json(
      { error: "Could not disconnect" },
      { status: 500 },
    );
  }
}
