import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { DASHBOARD_CARD_KEYS } from "@/lib/dashboard/card-keys";
import { saveDashboardOrder } from "@/lib/dashboard/layout";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { requireJsonRequest } from "@/lib/request-guards";

function unauthorized() {
  return NextResponse.json({ error: "Not signed in" }, { status: 401 });
}

/**
 * PUT /api/dashboard/layout — body { order: string[] }.
 *
 * Saves which order this user dragged their dashboard cards into. Unknown
 * keys are dropped rather than rejected: a slightly stale client sending a key
 * from before a card was renamed should not turn a drag into an error.
 */
export async function PUT(request: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const limited = enforceRateLimit(`dashboard-layout:${userId}`, LIMITS.write);
  if (limited) return limited;

  const contentTypeError = requireJsonRequest(request);
  if (contentTypeError) return contentTypeError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const order = (body as { order?: unknown })?.order;

  if (
    !Array.isArray(order) ||
    order.length > DASHBOARD_CARD_KEYS.length ||
    !order.every((key) => typeof key === "string")
  ) {
    return NextResponse.json({ error: "order must be a list of card keys" }, {
      status: 400,
    });
  }

  try {
    await saveDashboardOrder(userId, order);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/dashboard/layout failed:", error);
    return NextResponse.json(
      { error: "Could not save the layout" },
      { status: 500 },
    );
  }
}
