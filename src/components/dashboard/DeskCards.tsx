import Link from "next/link";
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

function money(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function rTone(value: number | null): string {
  if (value === null) return "text-muted";
  if (value > 0) return "text-positive";
  if (value < 0) return "text-negative";
  return "text-muted";
}

function formatR(value: number | null): string {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}R`;
}

/* ------------------------------------------------------------------ open */

export function OpenPositions({ positions }: { positions: OpenPosition[] }) {
  if (positions.length === 0) {
    return (
      <Empty>
        Nothing open. A trade counts as open until you record its exit —{" "}
        <JournalLink label="log one" />.
      </Empty>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {positions.map((position) => (
        <li key={position.id} className="flex items-center gap-3 py-2.5">
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
  );
}

/* -------------------------------------------------------------- exposure */

export function RiskExposure({ exposure }: { exposure: Exposure[] }) {
  if (exposure.length === 0) {
    return (
      <Empty>
        No defined risk open. Exposure needs a stop on the trade — without one
        there is no number to show.
      </Empty>
    );
  }

  return (
    <ul className="space-y-3">
      {exposure.map((row) => (
        <li key={row.asset}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium">{row.asset}</span>
            <span className="font-mono text-xs tabular-nums text-muted">
              {money(row.riskAmount)}
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
  );
}

/* --------------------------------------------------------- recent trades */

export function RecentTrades({ trades }: { trades: ClosedTrade[] }) {
  if (trades.length === 0) {
    return (
      <Empty>
        No closed trades yet. <JournalLink label="Record one" /> and its
        R-multiple is computed for you.
      </Empty>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {trades.map((trade) => (
        <li key={trade.id} className="flex items-center gap-3 py-2.5">
          <span className="w-16 shrink-0 font-mono text-[11px] text-muted">
            {trade.closedAt.slice(5, 10)}
          </span>

          <span className="min-w-0 flex-1 truncate text-sm">{trade.asset}</span>

          <span
            className={`shrink-0 font-mono text-xs tabular-nums ${rTone(trade.realizedR)}`}
          >
            {formatR(trade.realizedR)}
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
      <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-0.5 text-xl font-semibold tabular-nums ${tone}`}>
        {value}
      </p>
      {hint ? <p className="text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}

export function PerformanceStats({ performance }: { performance: Performance }) {
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
        <Stat
          label="Win rate"
          value={
            performance.winRatePercent === null
              ? "—"
              : `${performance.winRatePercent}%`
          }
        />
        <Stat
          label="Total R"
          value={formatR(performance.totalR)}
          tone={rTone(performance.totalR)}
        />
        <Stat
          label="Expectancy"
          value={formatR(performance.expectancyR)}
          tone={rTone(performance.expectancyR)}
          hint="per trade"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-3 text-xs text-muted">
        <span>
          Profit factor{" "}
          <span className="font-mono tabular-nums text-foreground">
            {/* Deliberately not shown as infinity: no losses yet is a fact
                about the sample, not about an edge. */}
            {performance.profitFactor === null
              ? "not yet — no losing trade"
              : performance.profitFactor.toFixed(2)}
          </span>
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
