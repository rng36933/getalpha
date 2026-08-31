import { Prisma, TradeDirection, TradeSource } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { normaliseSymbol } from "@/lib/mt5/symbol";

/**
 * Turning TradingView strategy alerts into journal rows.
 *
 * Nothing else this app syncs from works like this. MT5, MT4 and cTrader all
 * have a real broker account behind them: the terminal can be asked "what are
 * my open positions and my closed history right now" and simply resend the
 * whole answer on a timer, which is what makes those three idempotent and
 * self-healing on a restart (see `applySync` in `lib/mt5/sync.ts`).
 *
 * TradingView has none of that. A Pine Script alert fires once, on one order,
 * and is gone — there is no "current state" to re-ask for. So this is an
 * event log, not a resend: one webhook call per order, and a trade is built
 * up across two calls (the order that opens it, the order that flattens it)
 * rather than arriving whole. `strategy.position_size` is what tells the two
 * apart — the entry order leaves it non-zero, the exit order returns it to
 * zero — and pairing is by "the newest still-open row for this symbol", since
 * TradingView's own order ids differ between an entry and the exit that
 * closes it and cannot be used to match the two.
 *
 * This only supports one open position per symbol at a time, matching a
 * strategy.entry()/strategy.close() pattern without pyramiding — a second
 * same-direction entry while one is already open is treated as a re-affirm,
 * not a scale-in, and is intentionally a no-op rather than guessed at.
 */

export type TradingViewEvent = {
  symbol: string;
  /** The order TradingView just filled — "buy" or "sell", case-insensitive. */
  action: string;
  /** strategy.position_size after this order. 0 means flat. */
  positionSize: number;
  /** This order's own quantity — strategy.order.contracts. */
  contracts: number;
  price: number;
  /** ISO 8601 UTC, from {{time}}. */
  time: string;
  /** strategy.order.id, so a retried webhook delivery updates the same row. */
  id: string | null;
  /** strategy.order.comment, the closest thing to a stated setup name. */
  comment: string | null;
};

export type TradingViewResult =
  | { kind: "opened" }
  | { kind: "closed" }
  | { kind: "reversed" }
  | { kind: "ignored"; reason: string };

function parseDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function direction(action: string): TradeDirection | null {
  const lower = action.trim().toLowerCase();
  if (lower === "buy") return TradeDirection.BUY;
  if (lower === "sell") return TradeDirection.SELL;
  return null;
}

function setupTag(value: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed.slice(0, 64);
}

/**
 * (exit − entry) signed by direction, in price units per contract — the same
 * convention MT5/MT4's own EAs report, so a synced TradingView trade lands on
 * the dashboard reading the same as any other.
 */
function computePnl(
  entryPrice: number,
  exitPrice: number,
  dir: TradeDirection,
  contracts: number,
): Prisma.Decimal {
  const signed = dir === TradeDirection.BUY ? exitPrice - entryPrice : entryPrice - exitPrice;
  return new Prisma.Decimal(signed * contracts);
}

export async function applyTradingViewEvent(
  userId: string,
  event: TradingViewEvent,
): Promise<TradingViewResult> {
  const dir = direction(event.action);
  const openedOrClosedAt = parseDate(event.time);

  if (
    !dir ||
    !openedOrClosedAt ||
    typeof event.symbol !== "string" ||
    event.symbol.trim() === "" ||
    !Number.isFinite(event.price) ||
    event.price <= 0 ||
    !Number.isFinite(event.contracts) ||
    event.contracts <= 0 ||
    !Number.isFinite(event.positionSize)
  ) {
    return { kind: "ignored", reason: "malformed or incomplete event" };
  }

  const asset = normaliseSymbol(event.symbol.includes(":") ? event.symbol.split(":").pop()! : event.symbol);
  const flat = event.positionSize === 0;

  const open = await prisma.trade.findFirst({
    where: { userId, source: TradeSource.TRADINGVIEW, asset, exitPrice: null },
    orderBy: { createdAt: "desc" },
  });

  // Flattening with nothing open — most likely a webhook for a close this
  // app already applied (TradingView retries on a non-2xx, or the alert
  // fired twice), or an alert set up before this connection existed.
  if (flat && !open) {
    return { kind: "ignored", reason: "no open TradingView trade for this symbol" };
  }

  if (flat && open) {
    const pnl = computePnl(
      Number(open.entryPrice),
      event.price,
      open.direction,
      Number(open.size),
    );

    await prisma.trade.update({
      where: { id: open.id },
      data: {
        exitPrice: new Prisma.Decimal(event.price),
        closedAt: openedOrClosedAt,
        pnl,
      },
    });

    return { kind: "closed" };
  }

  // Not flat: either a fresh entry, a same-direction re-affirm (ignored —
  // see the file header), or a reversal (this order's direction opposes the
  // position already open, so it both closes the old trade and opens a new
  // one, same as strategy.entry() flipping a position in one call).
  if (open) {
    if (open.direction === dir) {
      return { kind: "ignored", reason: "already open in the same direction (no pyramiding)" };
    }

    const pnl = computePnl(
      Number(open.entryPrice),
      event.price,
      open.direction,
      Number(open.size),
    );

    await prisma.trade.update({
      where: { id: open.id },
      data: {
        exitPrice: new Prisma.Decimal(event.price),
        closedAt: openedOrClosedAt,
        pnl,
      },
    });

    await prisma.trade.create({
      data: {
        userId,
        source: TradeSource.TRADINGVIEW,
        // Reversal orders share one order id on some Pine Script patterns and
        // TradingView never guarantees otherwise, so this cannot key off
        // `event.id` the way a fresh entry does — a synthetic, still-unique
        // key keeps the row from colliding with whatever the next real entry
        // on this symbol brings.
        externalId: event.id ? `${event.id}:reversal` : null,
        asset,
        direction: dir,
        entryPrice: new Prisma.Decimal(event.price),
        size: new Prisma.Decimal(event.contracts),
        createdAt: openedOrClosedAt,
        setup: setupTag(event.comment),
      },
    });

    return { kind: "reversed" };
  }

  // A fresh entry. Keyed on the order id (when TradingView sent one) so a
  // retried delivery updates this same row instead of creating a duplicate —
  // the counterpart to how MT5/MT4 match on ticket.
  if (event.id) {
    await prisma.trade.upsert({
      where: { userId_source_externalId: { userId, source: TradeSource.TRADINGVIEW, externalId: event.id } },
      create: {
        userId,
        source: TradeSource.TRADINGVIEW,
        externalId: event.id,
        asset,
        direction: dir,
        entryPrice: new Prisma.Decimal(event.price),
        size: new Prisma.Decimal(event.contracts),
        createdAt: openedOrClosedAt,
        setup: setupTag(event.comment),
      },
      update: {},
    });
  } else {
    await prisma.trade.create({
      data: {
        userId,
        source: TradeSource.TRADINGVIEW,
        asset,
        direction: dir,
        entryPrice: new Prisma.Decimal(event.price),
        size: new Prisma.Decimal(event.contracts),
        createdAt: openedOrClosedAt,
        setup: setupTag(event.comment),
      },
    });
  }

  return { kind: "opened" };
}
