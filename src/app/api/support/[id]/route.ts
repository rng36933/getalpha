import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { SupportStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { requireJsonRequest } from "@/lib/request-guards";
import { isSupportReader } from "@/lib/support/admin";

/**
 * PATCH /api/support/[id] — body { status }.
 *
 * Marking a ticket done. Only for whoever reads them; a user cannot close
 * their own report, because "closed" is a statement about whether it was dealt
 * with, not about whether they are still bothered by it.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();

  // Not 403: someone who may not read tickets should not learn that this
  // endpoint exists or that the id they guessed was real.
  if (!isSupportReader(userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const limited = enforceRateLimit(`support-admin:${userId}`, LIMITS.write);
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

  const status = (body as { status?: unknown })?.status;

  if (status !== SupportStatus.OPEN && status !== SupportStatus.CLOSED) {
    return NextResponse.json(
      { error: "status must be OPEN or CLOSED" },
      { status: 400 },
    );
  }

  const { id } = await params;

  try {
    const updated = await prisma.supportTicket.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/support/[id] failed:", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
