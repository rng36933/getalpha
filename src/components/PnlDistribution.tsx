import { dashboardCopy } from "@/lib/i18n/app/dashboard";
import type { Locale } from "@/lib/i18n/locales";
import type { PnlDistribution as Data } from "@/lib/dashboard/pnl-distribution";
import { formatCompactMoney, formatMoney } from "@/lib/format/money";

/**
 * The shape of a trader's results, as columns.
 *
 * A histogram, because the question is where results cluster along an ordered
 * scale — and columns are the one form where a fat left tail is visible before
 * anything is read.
 *
 * Red left of break-even, green right of it, with the boundary drawn. The count
 * sits above every column that has one, so the colour is a second encoding
 * rather than the only one.
 *
 * The bin width is derived from the trader's own typical result rather than
 * fixed, because money has a scale and R did not — see `pnl-distribution.ts`.
 */
export default function PnlDistribution({
  data,
  currency,
  locale,
}: {
  data: Data;
  currency: string | null;
  locale: Locale;
}) {
  const copy = dashboardCopy(locale).pnlDistribution;
  const { bins, scored, peak, step, worstLoss, medianLoss } = data;

  // How far outside the usual a bad day went. This is the money answer to the
  // question R answered with "worse than planned": without a stop on the record
  // there is no plan to compare against, but there is still a typical loss, and
  // a worst loss several times that size is the same warning.
  const outlierFactor =
    worstLoss !== null && medianLoss !== null && medianLoss > 0
      ? worstLoss / medianLoss
      : null;

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <span className="flex items-baseline gap-2">
          <span className="figure text-[1.5rem]">{scored}</span>
          <span className="text-xs text-muted">{copy.closedTrades}</span>
        </span>

        <span className="flex items-baseline gap-2">
          <span
            className={`figure text-[1.5rem] ${
              outlierFactor !== null && outlierFactor >= 3
                ? "text-warning"
                : "text-muted"
            }`}
          >
            {worstLoss === null ? "—" : formatMoney(worstLoss, currency)}
          </span>
          <span className="text-xs text-muted">{copy.worstSingleLoss}</span>
        </span>

        <span className="flex items-baseline gap-2">
          <span className="figure text-[1.5rem] text-muted">
            {medianLoss === null ? "—" : formatMoney(medianLoss, currency)}
          </span>
          <span className="text-xs text-muted">{copy.typicalLoss}</span>
        </span>
      </div>

      {/* Columns rather than an SVG: ten bars with a label each is a job for
          flexbox, and this way the type is real text at real sizes. */}
      <div className="mt-5 flex h-40 items-end gap-1 sm:gap-1.5">
        {bins.map((bin, index) => {
          const height = peak > 0 ? (bin.count / peak) * 100 : 0;
          // The break-even boundary: drawn once, on the first winning bin.
          const isFirstWin =
            bin.sign === "WIN" && bins[index - 1]?.sign === "LOSS";

          return (
            <div
              key={bin.key}
              className={`relative flex h-full flex-1 flex-col justify-end ${
                isFirstWin ? "border-l border-line pl-1 sm:pl-1.5" : ""
              }`}
              title={copy.barTitle(bin.count, bin.percent)}
            >
              {bin.count > 0 ? (
                <span className="mb-1 text-center font-mono text-[10px] tabular-nums text-muted">
                  {bin.count}
                </span>
              ) : null}

              <span
                className={`w-full rounded-t-sm ${
                  bin.count === 0
                    ? "h-px bg-line"
                    : bin.sign === "WIN"
                      ? "bg-positive/70"
                      : "bg-negative/70"
                }`}
                style={bin.count === 0 ? undefined : { height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-1.5 flex gap-1 sm:gap-1.5">
        {bins.map((bin, index) => (
          <span
            key={bin.key}
            className={`flex-1 text-center font-mono text-[10px] tabular-nums text-muted ${
              bin.sign === "WIN" && bins[index - 1]?.sign === "LOSS"
                ? "pl-1 sm:pl-1.5"
                : ""
            }`}
          >
            {bin.labelValue === null
              ? ""
              : formatCompactMoney(bin.labelValue, currency)}
          </span>
        ))}
      </div>

      <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-muted">
        {outlierFactor !== null && outlierFactor >= 3
          ? copy.outlierNote(outlierFactor.toFixed(1))
          : copy.normalNote(formatMoney(step, currency))}
      </p>
    </div>
  );
}
