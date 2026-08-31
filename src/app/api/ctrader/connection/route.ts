import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { issueToken } from "@/lib/mt5/token";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";

function unauthorized() {
  return NextResponse.json({ error: "Not signed in" }, { status: 401 });
}

/**
 * POST /api/ctrader/connection
 *
 * The cTrader twin of /api/mt5/connection — same token issuance, same upsert
 * shape, scoped to `platform: "CTRADER"` so it holds an independent token
 * from a user's MT5/MT4/TradingView connections.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const limited = enforceRateLimit(`ctrader-connect:${userId}`, LIMITS.write);
  if (limited) return limited;

  const { token, hash } = issueToken("CTRADER");

  try {
    await prisma.mtConnection.upsert({
      where: { userId_platform: { userId, platform: "CTRADER" } },
      create: { userId, platform: "CTRADER", tokenHash: hash },
      // Regenerating invalidates the old token immediately, which is also how
      // somebody revokes a terminal they no longer control.
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
    console.error("POST /api/ctrader/connection failed:", error);
    return NextResponse.json(
      { error: "Could not create a connection token" },
      { status: 500 },
    );
  }
}

/** DELETE /api/ctrader/connection — disconnects the cBot. */
export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    await prisma.mtConnection.deleteMany({ where: { userId, platform: "CTRADER" } });
    return NextResponse.json({ disconnected: true });
  } catch (error) {
    console.error("DELETE /api/ctrader/connection failed:", error);
    return NextResponse.json(
      { error: "Could not disconnect" },
      { status: 500 },
    );
  }
}
