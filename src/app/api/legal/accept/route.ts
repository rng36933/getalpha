import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { CURRENT_LEGAL_VERSION } from "@/lib/legal/documents";
import { recordAcceptance } from "@/lib/legal/acceptance";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { requireJsonRequest } from "@/lib/request-guards";

/**
 * POST /api/legal/accept
 *
 * Body: { version } — the version the browser displayed.
 *
 * The version is checked rather than trusted. A tab left open across a
 * deployment would otherwise record consent to the new documents from someone
 * who only ever saw the old ones, which is worse than no record: it is a
 * record that says something untrue.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const limited = enforceRateLimit(`legal:${userId}`, LIMITS.write);
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

  const version = (body as { version?: unknown })?.version;

  if (version !== CURRENT_LEGAL_VERSION) {
    return NextResponse.json(
      {
        error: "These documents have changed since this page was opened.",
        reason: "VERSION_MISMATCH",
        currentVersion: CURRENT_LEGAL_VERSION,
      },
      { status: 409 },
    );
  }

  try {
    const acceptedAt = await recordAcceptance(userId);

    return NextResponse.json({
      accepted: true,
      version: CURRENT_LEGAL_VERSION,
      acceptedAt: acceptedAt.toISOString(),
    });
  } catch (error) {
    console.error("POST /api/legal/accept failed:", error);
    return NextResponse.json(
      { error: "Could not record your acceptance. Try again." },
      { status: 500 },
    );
  }
}
