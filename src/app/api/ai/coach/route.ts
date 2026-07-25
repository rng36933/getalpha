import { NextResponse } from "next/server";
import { reviewTrade } from "@/lib/ai/coach";
import { aiErrorResponse, badRequest, isRecord } from "@/lib/ai/http";
import {
  computePortfolioContext,
  computeTradeMetrics,
} from "@/lib/ai/trade-metrics";
import type { CoachInput } from "@/lib/ai/types";
import { prisma } from "@/lib/prisma";

/** How many prior trades the review is benchmarked against. */
const HISTORY_WINDOW = 50;

/**
 * POST /api/ai/coach
 *
 * Body: { tradeId }
 * Loads the trade and the trader's recent history, computes every metric in
 * code, then asks the model to judge the process.
 *
 * TODO: once authentication exists this must check that the trade belongs to
 * the session user. As written, any tradeId can be reviewed by anyone.
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { error: "Request body must be a JSON object" },
      { status: 400 },
    );
  }

  const tradeId = body.tradeId;
  if (typeof tradeId !== "string" || tradeId.trim() === "") {
    return badRequest(["tradeId: required, must be a non-empty string"]);
  }

  let trade;
  let history;

  try {
    trade = await prisma.trade.findUnique({ where: { id: tradeId.trim() } });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    history = await prisma.trade.findMany({
      where: { userId: trade.userId, createdAt: { lt: trade.createdAt } },
      orderBy: { createdAt: "desc" },
      take: HISTORY_WINDOW,
    });
  } catch (error) {
    console.error("POST /api/ai/coach failed to load trade:", error);
    return NextResponse.json({ error: "Failed to load trade" }, { status: 500 });
  }

  const input: CoachInput = {
    trade: {
      asset: trade.asset,
      direction: trade.direction,
      setup: trade.setup,
      timeframe: trade.timeframe,
      entryPrice: trade.entryPrice.toNumber(),
      exitPrice: trade.exitPrice?.toNumber() ?? null,
      stopLoss: trade.stopLoss?.toNumber() ?? null,
      takeProfit: trade.takeProfit?.toNumber() ?? null,
      size: trade.size.toNumber(),
      contractSize: trade.contractSize.toNumber(),
      pnl: trade.pnl?.toNumber() ?? null,
      accountBalance: trade.accountBalance?.toNumber() ?? null,
      marketContext: trade.marketContext,
      emotionalState: trade.emotionalState,
      openedAt: trade.createdAt.toISOString(),
      closedAt: trade.closedAt?.toISOString() ?? null,
    },
    metrics: computeTradeMetrics(trade),
    history: computePortfolioContext(history, trade),
  };

  try {
    const { data, usage } = await reviewTrade(input, trade.userId);
    return NextResponse.json({ review: data, metrics: input.metrics, usage });
  } catch (error) {
    return aiErrorResponse(error, "POST /api/ai/coach");
  }
}
