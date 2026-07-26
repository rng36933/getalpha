import type { RDistribution as Data } from "@/lib/dashboard/r-distribution";

/**
 * The shape of a trader's outcomes, as columns.
 *
 * A histogram, because the question is where results cluster along an ordered
 * scale — and columns are the one form where a spike at −1R, which is what
 * honoured stops look like, is visible before anything is read.
 *
 * Red left of break-even, green right of it, with the boundary drawn. The count
 * sits above every column that has one, so the colour is a second encoding
 * rather than the only one.
 */
export default function RDistribution({ data }: { data: Data }) {
  const { bins, scored, peak, worseThanPlanned, withinPlan } = data;

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <span className="flex items-baseline gap-2">
          <span className="figure text-[1.5rem]">{scored}</span>
          <span className="text-xs text-muted">trades with an R</span>
        </span>

        <span className="flex items-baseline gap-2">
          <span
            className={`figure text-[1.5rem] ${
              worseThanPlanned > 0 ? "text-warning" : "text-muted"
            }`}
          >
            {worseThanPlanned}
          </span>
          <span className="text-xs text-muted">lost more than planned</span>
        </span>

        <span className="flex items-baseline gap-2">
          <span className="figure text-[1.5rem] text-muted">{withinPlan}</span>
          <span className="text-xs text-muted">stopped within plan</span>
        </span>
      </div>

      {/* Columns rather than an SVG: ten bars with a label each is a job for
          flexbox, and this way the type is real text at real sizes. */}
      <div className="mt-5 flex h-40 items-end gap-1 sm:gap-1.5">
        {bins.map((bin, index) => {
          const height = peak > 0 ? (bin.count / peak) * 100 : 0;
          // The break-even boundary: drawn once, on the first winning bin.
          const isFirstWin = bin.sign === "WIN" && bins[index - 1]?.sign === "LOSS";

          return (
            <div
              key={bin.key}
              className={`relative flex h-full flex-1 flex-col justify-end ${
                isFirstWin ? "border-l border-line pl-1 sm:pl-1.5" : ""
              }`}
              title={`${bin.count} trade${bin.count === 1 ? "" : "s"} · ${bin.percent}%`}
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
            {bin.label}
          </span>
        ))}
      </div>

      <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-muted">
        {worseThanPlanned > 0
          ? `${worseThanPlanned} of ${scored} lost more than the risk they were sized for. A stop that is honoured produces −1R; past that it was moved, widened, or never really there.`
          : "Every loss came in at or inside the risk it was sized for, which is what a stop is for."}
      </p>
    </div>
  );
}
