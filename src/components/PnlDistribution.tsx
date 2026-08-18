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

  // A ring rather than a bar: the win/loss split read as a share of one
  // whole, the same job a donut does on the reference dashboards, without
  // pretending this is a portfolio allocation.
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const wonDash = (winPercent / 100) * circumference;

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div
        role="img"
        aria-label={`${winPercent}% won — ${wins} winning trades, ${losses} losing trades`}
        className="relative mx-auto size-32 shrink-0 sm:mx-0"
      >
        <svg viewBox="0 0 100 100" className="size-32 -rotate-90">
          <circle
            cx={50}
            cy={50}
            r={radius}
            fill="none"
            stroke="var(--negative)"
            strokeOpacity={0.35}
            strokeWidth={10}
          />
          <circle
            cx={50}
            cy={50}
            r={radius}
            fill="none"
            stroke="var(--positive)"
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${wonDash} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="figure text-3xl text-positive">{winPercent}%</span>
          <span className="text-[10px] uppercase tracking-wider text-muted">won</span>
        </div>
      </div>

      <div className="w-full flex-1 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-positive" aria-hidden="true" />
              {wins} won
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-negative" aria-hidden="true" />
              {losses} lost
            </span>
          </span>
        </div>

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
