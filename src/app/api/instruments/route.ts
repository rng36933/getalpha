import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { InstrumentKind } from "@/generated/prisma/client";
import { searchInstruments } from "@/lib/watchlist";

const KINDS: InstrumentKind[] = ["FOREX", "CRYPTO", "COMMODITY"];

/**
 * GET /api/instruments?q=eur&kind=FOREX&limit=20
 *
 * Searches the local catalogue. No provider call, so it costs nothing and can
 * be hit on every keystroke.
 */
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const query = params.get("q") ?? "";

  const rawKind = params.get("kind");
  if (rawKind !== null && !KINDS.includes(rawKind as InstrumentKind)) {
    return NextResponse.json(
      { error: `kind must be one of ${KINDS.join(", ")}` },
      { status: 400 },
    );
  }

  const rawLimit = Number(params.get("limit") ?? 20);
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 20;

  try {
    const results = await searchInstruments(
      query,
      (rawKind as InstrumentKind | null) ?? null,
      limit,
    );

    return NextResponse.json({ results, count: results.length });
  } catch (error) {
    console.error("GET /api/instruments failed:", error);
    return NextResponse.json(
      { error: "Failed to search instruments" },
      { status: 500 },
    );
  }
}
