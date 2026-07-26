import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { requireJsonRequest } from "@/lib/request-guards";
import { parseNoteUpdate } from "@/lib/trades/notes";

/**
 * PATCH /api/trades/[id]
 *
 * Body: any of { setup, timeframe, marketContext, emotionalState }.
 *
 * The reason this route exists is the MetaTrader sync. A synced trade arrives
 * with every number filled in and nothing about why it was taken, which is
 * exactly the half the AI review has most to say about. Prices and sizes stay
 * read-only: the terminal owns those and overwrites them on the next sync.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const limited = enforceRateLimit(`trades:${userId}`, LIMITS.write);
  if (limited) return limited;

  const wrongType = requireJsonRequest(request);
  if (wrongType) return wrongType;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const parsed = parseNoteUpdate(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.errors },
      { status: 400 },
    );
  }

  try {
    // userId is part of the filter rather than checked afterwards, so a guessed
    // id belonging to somebody else updates nothing instead of being read first.
    const { count } = await prisma.trade.updateMany({
      where: { id, userId },
      data: parsed.update,
    });

    if (count === 0) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, ...parsed.update });
  } catch (error) {
    console.error("PATCH /api/trades/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to update the trade" },
      { status: 500 },
    );
  }
}
