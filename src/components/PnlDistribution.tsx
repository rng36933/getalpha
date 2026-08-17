import type { PnlDistribution as Data } from "@/lib/dashboard/pnl-distribution";
import { formatMoney } from "@/lib/format/money";

/**
 * Wins against losses, as one shape.
 *
 * Was a nine-column histogram of where results land in money. Traded for a
 * two-slice split on the same underlying bins: how many trades won against
 * how many lost. The histogram's actual finding — a worst loss far outside
 * the typical one — survives as the sentence underneath, which is the part
 * anyone acts on; the column-by-column shape was detail past what a glance
 * at this card needs.
 */
export default function PnlDistribution({
  data,
  currency,
}: {
  data: Data;
  currency: string | null;
}) {
  const { bins, scored, worstLoss, medianLoss } = data;

  const wins = bins
    .filter((bin) => bin.sign === "WIN")
    .reduce((sum, bin) => sum + bin.count, 0);
  const losses = scored - wins;
  const winPercent = scored > 0 ? Math.round((wins / scored) * 100) : 0;

  // How far outside the usual a bad loss went. This is the money answer to
  // the question R answered with "worse than planned": without a stop on the
  // record there is no plan to compare against, but there is still a typical
  // loss, and a worst loss several times that size is the same warning.
  const outlierFactor =
    worstLoss !== null && medianLoss !== null && medianLoss > 0
      ? worstLoss / medianLoss
      : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-baseline gap-2">
          <span className="figure font-mono text-3xl text-positive">{winPercent}%</span>
          <span className="text-[11px] uppercase tracking-wider text-muted">won</span>
        </span>
        <span className="font-mono text-xs tabular-nums text-muted">
          {wins} / {losses}
        </span>
      </div>

      <div
        role="img"
        aria-label={`${wins} winning trades, ${losses} losing trades`}
        className="flex h-2 w-full overflow-hidden bg-negative"
      >
        <div
          className="h-full bg-positive"
          style={{ width: `${winPercent}%` }}
        />
      </div>

      <div className="w-full space-y-3">
        <p className="font-mono text-xs text-muted">{scored} closed trades</p>

        <p className="text-xs leading-relaxed text-muted">
          {outlierFactor !== null && outlierFactor >= 3 ? (
            <>
              Worst single loss{" "}
              <span className="text-warning">
                {formatMoney(worstLoss!, currency)}
              </span>{" "}
              is {outlierFactor.toFixed(1)}× the typical one (
              {formatMoney(medianLoss!, currency)}). A loss that far outside
              the usual is a stop that was moved, widened, or never really
              there.
            </>
          ) : worstLoss !== null && medianLoss !== null ? (
            <>
              Worst single loss {formatMoney(worstLoss, currency)}, typical
              loss {formatMoney(medianLoss, currency)}.
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
