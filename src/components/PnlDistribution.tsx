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
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
      <div
        role="img"
        aria-label={`${wins} winning trades, ${losses} losing trades`}
        className="relative size-32 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(var(--positive) 0deg ${
            winPercent * 3.6
          }deg, var(--negative) ${winPercent * 3.6}deg 360deg)`,
        }}
      >
        <div className="absolute inset-3 grid place-items-center rounded-full bg-surface">
          <span className="figure text-2xl">{winPercent}%</span>
          <span className="text-[10px] text-muted">won</span>
        </div>
      </div>

      <div className="w-full space-y-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
          <span className="flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full bg-positive" />
            {wins} won
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full bg-negative" />
            {losses} lost
          </span>
          <span className="text-muted">{scored} closed trades</span>
        </div>

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
