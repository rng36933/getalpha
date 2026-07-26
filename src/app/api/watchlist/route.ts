import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { requireJsonRequest } from "@/lib/request-guards";
import {
  MAX_WATCHLIST_SIZE,
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
} from "@/lib/watchlist";

function unauthorized() {
  return NextResponse.json({ error: "Not signed in" }, { status: 401 });
}

/** GET /api/watchlist — the signed-in user's instruments. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const entries = await getWatchlist(userId);
    return NextResponse.json({ entries, max: MAX_WATCHLIST_SIZE });
  } catch (error) {
    console.error("GET /api/watchlist failed:", error);
    return NextResponse.json(
      { error: "Failed to load the watchlist" },
      { status: 500 },
    );
  }
}

/** POST /api/watchlist — body { symbol }. */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const limited = enforceRateLimit(`watchlist:${userId}`, LIMITS.write);
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

  const symbol = (body as { symbol?: unknown })?.symbol;
  if (typeof symbol !== "string" || symbol.trim() === "") {
    return NextResponse.json(
      { error: "symbol: required, must be a non-empty string" },
      { status: 400 },
    );
  }

  try {
    const result = await addToWatchlist(userId, symbol.trim().toUpperCase());

    if (result.ok) {
      return NextResponse.json({ entries: result.entries }, { status: 201 });
    }

    switch (result.reason) {
      case "UNKNOWN_SYMBOL":
        return NextResponse.json({ error: "Unknown symbol" }, { status: 404 });
      case "ALREADY_PRESENT":
        // Not an error worth failing on — the list is already how they want it.
        return NextResponse.json(
          { entries: await getWatchlist(userId), alreadyPresent: true },
          { status: 200 },
        );
      case "LIST_FULL":
        return NextResponse.json(
          { error: `The watchlist holds at most ${MAX_WATCHLIST_SIZE} instruments` },
          { status: 409 },
        );
    }
  } catch (error) {
    console.error("POST /api/watchlist failed:", error);
    return NextResponse.json(
      { error: "Failed to update the watchlist" },
      { status: 500 },
    );
  }
}

/** DELETE /api/watchlist?symbol=EUR/USD */
export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const limited = enforceRateLimit(`watchlist:${userId}`, LIMITS.write);
  if (limited) return limited;

  const symbol = new URL(request.url).searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json(
      { error: "symbol query parameter is required" },
      { status: 400 },
    );
  }

  try {
    const { removed, entries } = await removeFromWatchlist(
      userId,
      symbol.trim().toUpperCase(),
    );

    if (!removed) {
      return NextResponse.json({ error: "Not in the watchlist" }, { status: 404 });
    }

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("DELETE /api/watchlist failed:", error);
    return NextResponse.json(
      { error: "Failed to update the watchlist" },
      { status: 500 },
    );
  }
}
