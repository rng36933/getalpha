import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { cleanNote } from "@/lib/journal/notes";
import { prisma } from "@/lib/prisma";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { requireJsonRequest } from "@/lib/request-guards";

/**
 * PATCH /api/trades/[id]
 *
 * Body: { notes: string }
 *
 * Sets the free-text note on one of the signed-in user's trades. Only the note
 * is writable here — prices and sizes on synced rows belong to the terminal,
 * which would overwrite them on the next sync anyway — and it works for synced
 * rows too, since the note is the one thing the terminal never sends.
 *
 * Stored in `Trade.marketContext`, the field the AI Coach already reads.
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const notes = (body as { notes?: unknown } | null)?.notes;
  if (typeof notes !== "string") {
    return NextResponse.json(
      { error: "notes: required, must be a string" },
      { status: 400 },
    );
  }

  const { id } = await params;
  const marketContext = cleanNote(notes);

  try {
    // Scoped by userId, not just id: somebody else's trade must read as "not
    // found" rather than "forbidden", which would confirm it exists.
    const result = await prisma.trade.updateMany({
      where: { id, userId },
      data: { marketContext },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    return NextResponse.json({ notes: marketContext });
  } catch (error) {
    console.error("PATCH /api/trades/[id] failed:", error);
    return NextResponse.json({ error: "Could not save the note" }, { status: 500 });
  }
}
