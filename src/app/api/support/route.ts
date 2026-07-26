import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { SupportKind } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { requireJsonRequest } from "@/lib/request-guards";
import { cleanMessage, cleanPageUrl } from "@/lib/support/sanitise";

const KINDS = Object.values(SupportKind);

/** POST /api/support — body { kind, message, pageUrl? }. */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const limited = enforceRateLimit(`support:${userId}`, LIMITS.write);
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

  const payload = body as {
    kind?: unknown;
    message?: unknown;
    pageUrl?: unknown;
  };

  if (typeof payload.kind !== "string" || !KINDS.includes(payload.kind as SupportKind)) {
    return NextResponse.json(
      { error: `kind must be one of ${KINDS.join(", ")}` },
      { status: 400 },
    );
  }

  if (typeof payload.message !== "string") {
    return NextResponse.json(
      { error: "message: required, must be a string" },
      { status: 400 },
    );
  }

  // Cleaned before it is measured, so a message made entirely of invisible
  // characters is empty rather than long enough to pass.
  const message = cleanMessage(payload.message);

  if (message.length < 10) {
    return NextResponse.json(
      { error: "Tell us a bit more — at least a sentence." },
      { status: 400 },
    );
  }

  try {
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        kind: payload.kind as SupportKind,
        message,
        pageUrl: cleanPageUrl(payload.pageUrl),
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json(
      { id: ticket.id, createdAt: ticket.createdAt.toISOString() },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/support failed:", error);
    return NextResponse.json(
      { error: "Could not send that. Try again shortly." },
      { status: 500 },
    );
  }
}
