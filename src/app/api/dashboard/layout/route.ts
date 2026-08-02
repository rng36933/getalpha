import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { LAYOUT_PAGES, isLayoutPage, saveOrder } from "@/lib/dashboard/layout";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { requireJsonRequest } from "@/lib/request-guards";

function unauthorized() {
  return NextResponse.json({ error: "Not signed in" }, { status: 401 });
}

/**
 * PUT /api/dashboard/layout — body { page: string, order: string[] }.
 *
 * Saves which order this user dragged one page's cards into. Unknown card
 * keys are dropped rather than rejected: a slightly stale client sending a
 * key from before a card was renamed should not turn a drag into an error.
 * An unrecognised `page` is rejected outright, since there is no key list to
 * validate `order` against.
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

  const { page, order } = body as { page?: unknown; order?: unknown };

  if (typeof page !== "string" || !isLayoutPage(page)) {
    return NextResponse.json(
      { error: `page must be one of: ${Object.keys(LAYOUT_PAGES).join(", ")}` },
      { status: 400 },
    );
  }

  const maxKeys = LAYOUT_PAGES[page].length;

  if (
    !Array.isArray(order) ||
    order.length > maxKeys ||
    !order.every((key) => typeof key === "string")
  ) {
    return NextResponse.json({ error: "order must be a list of card keys" }, {
      status: 400,
    });
  }

  try {
    await saveOrder(userId, page, order);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/dashboard/layout failed:", error);
    return NextResponse.json(
      { error: "Could not save the layout" },
      { status: 500 },
    );
  }
}
