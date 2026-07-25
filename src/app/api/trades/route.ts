import { NextResponse } from "next/server";
import { Prisma, TradeDirection } from "@/generated/prisma/client";
import type { Trade } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Decimal and Date do not survive JSON.stringify in a useful shape, so every
 * response goes through this instead of returning the Prisma record directly.
 */
function serializeTrade(trade: Trade) {
  return {
    id: trade.id,
    userId: trade.userId,
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
    createdAt: trade.createdAt.toISOString(),
    closedAt: trade.closedAt?.toISOString() ?? null,
  };
}

function optionalDate(
  value: unknown,
  field: string,
  errors: string[],
): Date | null {
  if (value === undefined || value === null || value === "") return null;

  if (typeof value !== "string") {
    errors.push(`${field}: must be an ISO 8601 date string`);
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    errors.push(`${field}: must be a valid ISO 8601 date string`);
    return null;
  }

  return parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(
  value: unknown,
  field: string,
  errors: string[],
): string {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${field}: required, must be a non-empty string`);
    return "";
  }
  return value.trim();
}

function optionalString(
  value: unknown,
  field: string,
  errors: string[],
): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    errors.push(`${field}: must be a string`);
    return null;
  }
  return value.trim();
}

function parseDecimal(
  value: unknown,
  field: string,
  errors: string[],
  options: { required: boolean; positive?: boolean },
): Prisma.Decimal | null {
  if (value === undefined || value === null || value === "") {
    if (options.required) errors.push(`${field}: required`);
    return null;
  }

  if (typeof value !== "number" && typeof value !== "string") {
    errors.push(`${field}: must be a number`);
    return null;
  }

  let decimal: Prisma.Decimal;
  try {
    decimal = new Prisma.Decimal(value);
  } catch {
    errors.push(`${field}: must be a valid number`);
    return null;
  }

  if (!decimal.isFinite()) {
    errors.push(`${field}: must be a finite number`);
    return null;
  }

  if (options.positive && decimal.lte(0)) {
    errors.push(`${field}: must be greater than 0`);
    return null;
  }

  return decimal;
}

/**
 * GET /api/trades — all trades, newest first.
 *
 * TODO: once authentication exists this must filter by the session user.
 * As written it returns every user's trades to anyone who calls it.
 */
export async function GET() {
  try {
    const trades = await prisma.trade.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(trades.map(serializeTrade));
  } catch (error) {
    console.error("GET /api/trades failed:", error);
    return NextResponse.json(
      { error: "Failed to load trades" },
      { status: 500 },
    );
  }
}

/** POST /api/trades — create one trade. */
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

  const errors: string[] = [];

  const userId = requireString(body.userId, "userId", errors);
  const asset = requireString(body.asset, "asset", errors);

  const direction = body.direction;
  if (direction !== TradeDirection.BUY && direction !== TradeDirection.SELL) {
    errors.push('direction: must be either "BUY" or "SELL"');
  }

  const entryPrice = parseDecimal(body.entryPrice, "entryPrice", errors, {
    required: true,
    positive: true,
  });
  const size = parseDecimal(body.size, "size", errors, {
    required: true,
    positive: true,
  });
  const exitPrice = parseDecimal(body.exitPrice, "exitPrice", errors, {
    required: false,
    positive: true,
  });
  const stopLoss = parseDecimal(body.stopLoss, "stopLoss", errors, {
    required: false,
    positive: true,
  });
  const takeProfit = parseDecimal(body.takeProfit, "takeProfit", errors, {
    required: false,
    positive: true,
  });
  // pnl is intentionally not `positive`: a loss is a valid value.
  const pnl = parseDecimal(body.pnl, "pnl", errors, { required: false });
  const accountBalance = parseDecimal(
    body.accountBalance,
    "accountBalance",
    errors,
    { required: false, positive: true },
  );

  // Defaults to 1 so callers that quote size in units can ignore it entirely.
  const contractSize =
    body.contractSize === undefined || body.contractSize === null
      ? new Prisma.Decimal(1)
      : parseDecimal(body.contractSize, "contractSize", errors, {
          required: true,
          positive: true,
        });

  const setup = optionalString(body.setup, "setup", errors);
  const timeframe = optionalString(body.timeframe, "timeframe", errors);
  const marketContext = optionalString(
    body.marketContext,
    "marketContext",
    errors,
  );
  const emotionalState = optionalString(
    body.emotionalState,
    "emotionalState",
    errors,
  );
  const closedAt = optionalDate(body.closedAt, "closedAt", errors);

  if (errors.length > 0 || !entryPrice || !size) {
    return NextResponse.json(
      { error: "Validation failed", details: errors },
      { status: 400 },
    );
  }

  try {
    const trade = await prisma.trade.create({
      data: {
        userId,
        asset,
        direction: direction as TradeDirection,
        setup,
        timeframe,
        entryPrice,
        exitPrice,
        stopLoss,
        takeProfit,
        size,
        contractSize: contractSize ?? new Prisma.Decimal(1),
        pnl,
        accountBalance,
        marketContext,
        emotionalState,
        closedAt,
      },
    });

    return NextResponse.json(serializeTrade(trade), { status: 201 });
  } catch (error) {
    console.error("POST /api/trades failed:", error);
    return NextResponse.json(
      { error: "Failed to create trade" },
      { status: 500 },
    );
  }
}
