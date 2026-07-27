import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { fetchCandles, parseTimeframe } from "@/lib/market-data/candles";
import { getWatchlist } from "@/lib/watchlist";

/**
 * GET /api/candles?symbol=XAU%2FUSD&tf=M15
 *
 * The bars behind the dashboard chart, so it can refresh itself without
 * reloading the page and throwing away everything else on it.
 *
 * This costs provider credits, so it is guarded twice. The route is private,
 * like everything under /api that is not explicitly opened. And the symbol has
 * to be on the caller's own watchlist: `fetchCandles` is cached per
 * `symbol@timeframe`, but a symbol nobody watches has no cached copy, so an
 * open endpoint would let anyone spend the whole app's eight credits a minute
 * by asking for instruments in a loop. Same rule as the day tape.
 *
 * A refused symbol answers 403 rather than fetching it anyway. Refusing is the
 * point; a helpful fallback here would be the vulnerability.
 */
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol");
  const timeframe = parseTimeframe(url.searchParams.get("tf") ?? undefined);

  if (!symbol) {
    return NextResponse.json({ error: "symbol: required" }, { status: 400 });
  }

  try {
    const watchlist = await getWatchlist(userId);
    const watched = watchlist.some((entry) => entry.symbol === symbol);

    if (!watched) {
      return NextResponse.json(
        { error: "That instrument is not on your watchlist" },
        { status: 403 },
      );
    }

    const candles = await fetchCandles(symbol, timeframe);

    // `fetchCandles` degrades to the last good snapshot rather than throwing,
    // and reports which happened — passed through, so the client can tell a
    // stale chart from a fresh one instead of drawing old bars as current.
    return NextResponse.json({
      candles: candles.data,
      status: candles.status,
      fetchedAt: candles.fetchedAt,
    });
  } catch (error) {
    console.error("GET /api/candles failed:", error);
    return NextResponse.json(
      { error: "Could not read the bars" },
      { status: 502 },
    );
  }
}
