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
              {position.riskPercent !== null ? (
                `${position.riskPercent.toFixed(2)}% risk`
              ) : position.stopWasSet ? (
                <span className="text-positive">profit locked</span>
              ) : (
                <span className="text-warning">no stop</span>
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
 * A row of discrete LED-style segments rather than a smooth bar — it reads
 * like a terminal meter (matches the `// WIN RATE` label styling) and each
 * segment is a legible 5-point chunk instead of a fill that has to be
 * measured by eye. The center gap marks 50%, the number this gets compared
 * against.
 */
function WinRateMeter({ percent }: { percent: number }) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const SEGMENTS = 20;
  const lit = Math.round((clamped / 100) * SEGMENTS);
  const tone = percent >= 50 ? "var(--positive)" : "var(--negative)";

  return (
    <div className="mt-3">
      <div className="flex gap-[3px]">
        {Array.from({ length: SEGMENTS }, (_, i) => {
          const isLit = i < lit;
          const isMidline = i === SEGMENTS / 2 - 1;
          return (
            <span
              key={i}
              className={`h-3 w-1 rounded-[1px] transition-colors duration-300 ${
                isMidline ? "mr-[3px]" : ""
              }`}
              style={{
                backgroundColor: isLit ? tone : "var(--line)",
                boxShadow: isLit ? `0 0 5px ${tone}` : "none",
              }}
            />
          );
        })}
      </div>
      <p className="mt-2.5 text-[11px] text-muted">
        {percent >= 50 ? "past" : "short of"} a coin flip
      </p>
    </div>
  );
}

/**
 * Gross win R against gross loss R, drawn as two rows of LED segments rather
 * than a split bar. Every trader's R-multiples aren't identical chunks, but
 * discretizing the ratio into a fixed set of lit blocks per side makes "how
 * much came back per unit risked" scannable as a shape, matching the win-rate
 * meter's terminal-readout language instead of a plain proportion fill.
 */
function ProfitFactorBar({ factor }: { factor: number }) {
  // factor = win / loss, so the won share of the whole is factor / (factor + 1).
  const wonShare = (factor / (factor + 1)) * 100;
  const SEGMENTS = 20;
  const wonLit = Math.round((wonShare / 100) * SEGMENTS);
  const lostLit = SEGMENTS - wonLit;

  return (
    <div className="mt-2">
      <div className="flex gap-[3px]">
        {Array.from({ length: wonLit }, (_, i) => (
          <span
            key={`won-${i}`}
            className="h-3 w-1 rounded-[1px]"
            style={{
              backgroundColor: "var(--positive)",
              boxShadow: "0 0 5px var(--positive)",
            }}
          />
        ))}
        {wonLit > 0 && lostLit > 0 ? <span className="mx-[2px] w-px bg-line" /> : null}
        {Array.from({ length: lostLit }, (_, i) => (
          <span
            key={`lost-${i}`}
            className="h-3 w-1 rounded-[1px]"
            style={{
              backgroundColor: "var(--negative)",
              boxShadow: "0 0 5px var(--negative)",
            }}
          />
        ))}
      </div>
      <p className="mt-1 text-[11px] text-muted">
        {factor >= 1
          ? `${factor.toFixed(2)}R back for every 1R at risk`
          : `only ${factor.toFixed(2)}R back for every 1R at risk`}
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
