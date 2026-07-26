import { Prisma, TradeDirection, TradeSource } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { normaliseSymbol } from "./symbol";

/**
 * Applying what a terminal sent.
 *
 * The terminal is the source of truth for anything it owns: it resends the
 * open positions it can see and the trades it has closed, and this overwrites
 * rather than appends. That is what makes a restart harmless — the EA has no
 * memory to lose, and re-sending everything it knows converges on the same
 * rows instead of duplicating them.
 */

/** One position or closed trade, as the EA sends it. */
export type IncomingTrade = {
  /** MT5 position ticket. Unique per account, stable from open to close. */
  ticket: string;
  symbol: string;
  direction: "BUY" | "SELL";
  volume: number;
  /** Units per lot, read from the symbol rather than assumed. */
  contractSize: number;
  entryPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  /** Null while the position is open. */
  exitPrice: number | null;
  profit: number | null;
  /** Account balance when the terminal reported this, in account currency. */
  accountBalance: number | null;
  openedAt: string;
  closedAt: string | null;
};

/**
 * Applied counts rows written, not rows inserted.
 *
 * The upsert does not report which of the two it did, and finding out would
 * cost a read per trade to answer a question nobody asks — the terminal resends
 * what it knows and the answer that matters is how many landed.
 */
export type SyncResult = { applied: number; skipped: number };

function decimal(value: number | null): Prisma.Decimal | null {
  if (value === null || !Number.isFinite(value) || value === 0) return null;
  return new Prisma.Decimal(value);
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * A trade the terminal sent is only usable if the numbers are.
 *
 * Rejected quietly rather than stored as nulls: a row with no entry price
 * would produce an R-multiple of nothing and sit in the journal looking like a
 * trade.
 */
function isUsable(trade: IncomingTrade): boolean {
  return (
    typeof trade.ticket === "string" &&
    trade.ticket.length > 0 &&
    typeof trade.symbol === "string" &&
    trade.symbol.length > 0 &&
    (trade.direction === "BUY" || trade.direction === "SELL") &&
    Number.isFinite(trade.entryPrice) &&
    trade.entryPrice > 0 &&
    Number.isFinite(trade.volume) &&
    trade.volume > 0 &&
    parseDate(trade.openedAt) !== null
  );
}

export async function applySync(
  userId: string,
  trades: IncomingTrade[],
): Promise<SyncResult> {
  let applied = 0;
  let skipped = 0;

  for (const incoming of trades) {
    if (!isUsable(incoming)) {
      skipped += 1;
      continue;
    }

    const openedAt = parseDate(incoming.openedAt);
    if (!openedAt) {
      skipped += 1;
      continue;
    }

    const shared = {
      // Normalised on the way in, not on the way out. The stored value is what
      // every later grouping and join uses, so a display-time fix would leave
      // the database holding two names for one instrument — and the per-pair
      // page would keep computing two win rates from half the evidence each.
      asset: normaliseSymbol(incoming.symbol),
      direction:
        incoming.direction === "BUY" ? TradeDirection.BUY : TradeDirection.SELL,
      entryPrice: new Prisma.Decimal(incoming.entryPrice),
      size: new Prisma.Decimal(incoming.volume),
      // Sent by the terminal, never assumed. One XAUUSD lot is 100 ounces and
      // guessing 1 makes every R-multiple on gold wrong by that factor.
      contractSize: new Prisma.Decimal(
        Number.isFinite(incoming.contractSize) && incoming.contractSize > 0
          ? incoming.contractSize
          : 1,
      ),
      stopLoss: decimal(incoming.stopLoss),
      takeProfit: decimal(incoming.takeProfit),
      exitPrice: decimal(incoming.exitPrice),
      pnl:
        incoming.profit !== null && Number.isFinite(incoming.profit)
          ? new Prisma.Decimal(incoming.profit)
          : null,
      accountBalance: decimal(incoming.accountBalance),
      closedAt: parseDate(incoming.closedAt),
      source: TradeSource.MT5,
    };

    try {
      // Matched on the position ticket. An open position and the closed trade
      // it becomes are the same row, so closing updates rather than inserting.
      await prisma.trade.upsert({
        where: {
          userId_externalId: { userId, externalId: incoming.ticket },
        },
        create: {
          userId,
          externalId: incoming.ticket,
          createdAt: openedAt,
          ...shared,
        },
        // `createdAt` is absent from the update on purpose: it is when the
        // position opened, and a terminal resending it must not move a trade's
        // place in the journal.
        update: shared,
        select: { id: true },
      });

      applied += 1;
    } catch (error) {
      console.error(`MT5 sync could not store ticket ${incoming.ticket}:`, error);
      skipped += 1;
    }
  }

  return { applied, skipped };
}
