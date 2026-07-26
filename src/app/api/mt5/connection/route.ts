import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { issueToken } from "@/lib/mt5/token";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";

function unauthorized() {
  return NextResponse.json({ error: "Not signed in" }, { status: 401 });
}

/**
 * POST /api/mt5/connection
 *
 * Issues a connection token, replacing any existing one. The plaintext is in
 * this response and nowhere else — it is never stored, so it cannot be shown
 * again and asking for it again means issuing a new one.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const limited = enforceRateLimit(`mt5-connect:${userId}`, LIMITS.write);
  if (limited) return limited;

  const { token, hash } = issueToken();

  try {
    await prisma.mtConnection.upsert({
      where: { userId },
      create: { userId, tokenHash: hash },
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
    console.error("POST /api/mt5/connection failed:", error);
    return NextResponse.json(
      { error: "Could not create a connection token" },
      { status: 500 },
    );
  }
}

/** DELETE /api/mt5/connection — disconnects the terminal. */
export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    await prisma.mtConnection.deleteMany({ where: { userId } });
    return NextResponse.json({ disconnected: true });
  } catch (error) {
    console.error("DELETE /api/mt5/connection failed:", error);
    return NextResponse.json(
      { error: "Could not disconnect" },
      { status: 500 },
    );
  }
}
