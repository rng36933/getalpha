import Link from "next/link";
import AssetBadge from "@/components/AssetBadge";
import { formatMoney, formatSignedMoney } from "@/lib/format/money";
import type {
  ClosedTrade,
  Exposure,
  OpenPosition,
  Performance,
} from "@/lib/dashboard/summary";

/**
 * The cards that read the journal.
 *
 * Their empty states point at the one action that fills them. A dashboard with
 * nothing in it is the normal first experience, and "no data" tells somebody
 * they are stuck rather than what to do next.
 */

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-full min-h-32 place-items-center px-4 text-center">
      <p className="text-sm text-muted">{children}</p>
    </div>
  );
}

function JournalLink({ label }: { label: string }) {
  return (
    <Link href="/dashboard/journal" className="text-accent hover:underline">
      {label}
    </Link>
  );
}

function tone(value: number | null): string {
  if (value === null) return "text-muted";
  if (value > 0) return "text-positive";
  if (value < 0) return "text-negative";
  return "text-muted";
}

function pnl(value: number | null, currency: string | null): string {
  if (value === null) return "—";
  return formatSignedMoney(value, currency);
}

/* ------------------------------------------------------------------ open */

export function OpenPositions({ positions }: { positions: OpenPosition[] }) {
  if (positions.length === 0) {
    return (
      <Empty>Nothing open.</Empty>
    );
  }

  return (
    // A tall card with only one or two open positions used to leave the rest
    // of its height as dead space below the list — centering here means a
    // short list reads as complete, not as a bug that forgot to fill in the
    // rest.
    <div className="flex flex-1 flex-col justify-center">
      <ul className="divide-y divide-line">
        {positions.map((position) => (
          <li key={position.id} className="flex items-center gap-3 py-2.5">
            <AssetBadge label={position.asset} />

            <span
              className={`w-10 shrink-0 font-mono text-[11px] ${
                position.direction === "BUY" ? "text-positive" : "text-negative"
              }`}
            >
              {position.direction === "BUY" ? "BUY" : "SELL"}
            </span>

            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {position.asset}
            </span>

            <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
              {position.riskPercent === null ? (
                <span className="text-warning">no stop</span>
              ) : (
                `${position.riskPercent.toFixed(2)}% risk`
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------- exposure */

export function RiskExposure({
  exposure,
  currency,
}: {
  exposure: Exposure[];
  currency: string | null;
}) {
  if (exposure.length === 0) {
    return (
      <Empty>
        No defined risk open. Exposure needs a stop on the trade — without one
        there is no number to show.
      </Empty>
    );
  }

  return (
    <div className="flex flex-1 flex-col justify-center">
      <ul className="space-y-3">
        {exposure.map((row) => (
          <li key={row.asset}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium">{row.asset}</span>
              <span className="font-mono text-xs tabular-nums text-muted">
                {formatMoney(row.riskAmount, currency)}
              </span>
            </div>

            <div
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-raised"
              role="img"
              aria-label={`${row.share}% of open risk`}
            >
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${row.share}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------------------------------- recent trades */

export function RecentTrades({
  trades,
  currency,
}: {
  trades: ClosedTrade[];
  currency: string | null;
}) {
  if (trades.length === 0) {
    return (
      <Empty>
        No closed trades yet. <JournalLink label="Connect MetaTrader" /> and they
        arrive by themselves.
      </Empty>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {trades.map((trade) => (
        <li key={trade.id} className="flex items-center gap-3 py-2.5">
          <AssetBadge label={trade.asset} />

          <span className="w-16 shrink-0 font-mono text-[11px] text-muted">
            {trade.closedAt.slice(5, 10)}
          </span>

          <span className="min-w-0 flex-1 truncate text-sm">{trade.asset}</span>

          <span
            className={`w-20 shrink-0 text-right font-mono text-xs tabular-nums ${tone(trade.pnl)}`}
          >
            {pnl(trade.pnl, currency)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ----------------------------------------------------------- performance */

function Stat({
  label,
  value,
  tone = "",
  hint,
}: {
  label: string;
  value: string;
  tone?: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
        {"// "}
        {label}
      </p>
      <p className={`figure mt-1 font-mono text-2xl font-bold tracking-tight ${tone}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 font-mono text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}

/**
 * A win rate given a shape as well as a number.
 *
 * A bar rather than a ring or a gauge: the quantity is a proportion of one whole
 * thing, and a straight line is the one form where "a bit over half" is legible
 * without reading the figure. The 50% mark is drawn because that is the number
 * this one gets compared against, and a rate with no reference is a number
 * floating on its own.
 */
function WinRateMeter({ percent }: { percent: number }) {
  const clamped = Math.min(Math.max(percent, 0), 100);

  return (
    <div className="mt-3">
      <div className="relative h-3 overflow-hidden bg-surface-raised">
        <span
          className={`absolute inset-y-0 left-0 ${
            percent >= 50 ? "bg-positive/80" : "bg-negative/80"
          }`}
          style={{ width: `${clamped}%` }}
        />
        <span className="absolute inset-y-0 left-1/2 w-px bg-line" />
      </div>
      {/* The figure above is the primary readout; this tick ties it to the
          exact point on the bar it describes, rather than leaving the two
          to be matched up by eye. */}
      <div className="relative mt-1 h-3">
        <span
          className="absolute -translate-x-1/2 font-mono text-[10px] tabular-nums text-muted"
          style={{ left: `${clamped}%` }}
        >
          {percent}%
        </span>
      </div>
      <p className="mt-2.5 text-[11px] text-muted">
        {percent >= 50 ? "above" : "below"} an even split
      </p>
    </div>
  );
}

/**
 * Gross win R against gross loss R, drawn as the two sides of the same bar.
 *
 * The profit factor is a ratio, and a ratio is the one thing a single bar cannot
 * show. Two segments of one bar can: how much of the total R moved was won and
 * how much was lost.
 */
function ProfitFactorBar({ factor }: { factor: number }) {
  // factor = win / loss, so the won share of the whole is factor / (factor + 1).
  const wonShare = (factor / (factor + 1)) * 100;

  return (
    <div className="mt-2">
      <div className="flex h-3 gap-0.5 overflow-hidden">
        <span
          className="bg-positive/80"
          style={{ width: `${wonShare}%` }}
        />
        <span className="flex-1 bg-negative/80" />
      </div>
      <p className="mt-1 text-[11px] text-muted">
        {factor >= 1
          ? `${factor.toFixed(2)}R won per 1R lost`
          : `only ${factor.toFixed(2)}R won per 1R lost`}
      </p>
    </div>
  );
}

export function PerformanceStats({
  performance,
  currency,
}: {
  performance: Performance;
  currency: string | null;
}) {
  if (performance.closedCount === 0) {
    return (
      <Empty>
        Statistics start once a trade is closed.{" "}
        <JournalLink label="Open the journal" />.
      </Empty>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label="Closed"
          value={String(performance.closedCount)}
        />
        <div>
          <Stat
            label="Win rate"
            value={
              performance.winRatePercent === null
                ? "—"
                : `${performance.winRatePercent}%`
            }
          />
          {performance.winRatePercent !== null ? (
            <WinRateMeter percent={performance.winRatePercent} />
          ) : null}
        </div>
        <Stat
          label="Total P&L"
          value={pnl(performance.totalPnl, currency)}
          tone={tone(performance.totalPnl)}
        />
        <div>
          <Stat
            label="Profit factor"
            value={
              performance.profitFactor === null
                ? "—"
                : performance.profitFactor.toFixed(2)
            }
            tone={
              performance.profitFactor === null
                ? ""
                : performance.profitFactor >= 1
                  ? "text-positive"
                  : "text-negative"
            }
          />
          {performance.profitFactor === null ? (
            // Deliberately not infinity: no losses yet is a fact about the
            // sample, not about an edge.
            <p className="mt-1 text-[11px] text-muted">no losing trade yet</p>
          ) : (
            <ProfitFactorBar factor={performance.profitFactor} />
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-line pt-3 text-xs text-muted">
        <span>
          Expectancy{" "}
          <span
            className={`font-mono tabular-nums ${tone(performance.expectancyPnl)}`}
          >
            {pnl(performance.expectancyPnl, currency)}
          </span>{" "}
          per trade
        </span>

        {performance.withoutStop > 0 ? (
          <span className="text-warning">
            {performance.withoutStop} trade
            {performance.withoutStop === 1 ? "" : "s"} logged without a stop
          </span>
        ) : null}
      </div>
    </div>
  );
}
