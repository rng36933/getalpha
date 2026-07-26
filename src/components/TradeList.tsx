import type { TradeMetrics } from "@/lib/ai/trade-metrics";

export type TradeRow = {
  id: string;
  asset: string;
  direction: "BUY" | "SELL";
  setup: string | null;
  timeframe: string | null;
  entryPrice: number;
  exitPrice: number | null;
  pnl: number | null;
  createdAt: string;
  metrics: TradeMetrics;
};

const EXIT_LABEL: Record<TradeMetrics["exitClassification"], string> = {
  HIT_TARGET: "Target",
  HIT_STOP: "Stop",
  DISCRETIONARY_EXIT: "Discretionary",
  BEYOND_TARGET: "Past target",
  BEYOND_STOP: "Past stop",
  STILL_OPEN: "Open",
  UNKNOWN: "—",
};

/** Two decimals, and a sign, because "+1.80R" reads faster than "1.8". */
function formatR(value: number | null): string {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}R`;
}

function toneFor(value: number | null): string {
  if (value === null) return "text-muted";
  if (value > 0) return "text-positive";
  if (value < 0) return "text-negative";
  return "text-muted";
}

export default function TradeList({ trades }: { trades: TradeRow[] }) {
  if (trades.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No trades yet. Log one above and the R-multiple appears here.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
            <th className="py-2 pr-3 text-left font-normal">Date</th>
            <th className="py-2 pr-3 text-left font-normal">Instrument</th>
            <th className="py-2 pr-3 text-left font-normal">Side</th>
            <th className="py-2 pr-3 text-left font-normal">Setup</th>
            <th className="py-2 pr-3 text-right font-normal">Risk</th>
            <th className="py-2 pr-3 text-right font-normal">Planned RR</th>
            <th className="py-2 pr-3 text-left font-normal">Exit</th>
            <th className="py-2 text-right font-normal">Result</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-line">
          {trades.map((trade) => (
            <tr key={trade.id}>
              <td className="py-3 pr-3 font-mono text-xs text-muted">
                {trade.createdAt.slice(0, 10)}
              </td>
              <td className="py-3 pr-3 font-medium">{trade.asset}</td>
              <td className="py-3 pr-3">
                <span
                  className={
                    trade.direction === "BUY" ? "text-positive" : "text-negative"
                  }
                >
                  {trade.direction === "BUY" ? "Buy" : "Sell"}
                </span>
              </td>
              <td className="py-3 pr-3 text-muted">{trade.setup ?? "—"}</td>
              <td className="py-3 pr-3 text-right font-mono text-xs">
                {trade.metrics.riskPercent === null ? (
                  // Not a missing value to shrug at: no stop means no defined
                  // risk, and the review says so too.
                  <span className="text-warning">no stop</span>
                ) : (
                  <span
                    className={
                      trade.metrics.flags.riskAboveTwoPercent
                        ? "text-warning"
                        : "text-muted"
                    }
                  >
                    {trade.metrics.riskPercent.toFixed(2)}%
                  </span>
                )}
              </td>
              <td className="py-3 pr-3 text-right font-mono text-xs text-muted">
                {trade.metrics.plannedRR === null
                  ? "—"
                  : `${trade.metrics.plannedRR.toFixed(2)}`}
              </td>
              <td className="py-3 pr-3 text-xs text-muted">
                {EXIT_LABEL[trade.metrics.exitClassification]}
              </td>
              <td
                className={`py-3 text-right font-mono ${toneFor(trade.metrics.realizedR)}`}
              >
                {formatR(trade.metrics.realizedR)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
