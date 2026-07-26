import {
  MIN_SAMPLE_FOR_RATE,
  SESSION_HOURS,
  type Bucket,
  type PairBreakdown,
} from "@/lib/analysis/per-pair";

/** "+1.80R", because a sign reads faster than a colour alone. */
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

function Stat({
  label,
  value,
  tone = "",
  note,
}: {
  label: string;
  value: string;
  tone?: string;
  note?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-raised px-3 py-2.5">
      <p className="eyebrow">{label}</p>
      <p className={`figure mt-1.5 text-[1.4rem] ${tone}`}>{value}</p>
      {note ? (
        <p className="mt-1 text-[11px] leading-snug text-muted">{note}</p>
      ) : null}
    </div>
  );
}

/**
 * One slice of the record as a row.
 *
 * A win rate is withheld below `MIN_SAMPLE_FOR_RATE` and the raw count shown
 * instead. "100% on Tuesdays" from a single trade is not a finding, and
 * printing it as one is how a page like this starts lying.
 */
function BucketRow({
  bucket,
  hint,
  scale,
}: {
  bucket: Bucket;
  hint?: string;
  /** Largest absolute total R in this table, so bars share one scale. */
  scale: number;
}) {
  const thin = bucket.scored < MIN_SAMPLE_FOR_RATE;
  const r = bucket.totalR ?? 0;
  // Both sides measured against the same number, or a −2R bar would look the
  // same length as a +6R one and the chart would be worse than the text.
  const width = scale > 0 ? (Math.abs(r) / scale) * 50 : 0;

  return (
    <tr className="border-t border-line">
      <td className="py-2 pr-3">
        <span className="text-sm">{bucket.label}</span>
        {hint ? (
          <span className="ml-2 font-mono text-[11px] text-muted">{hint}</span>
        ) : null}
      </td>
      <td className="py-2 pr-3 text-right font-mono text-xs text-muted">
        {bucket.trades}
      </td>
      <td className="py-2 pr-3 text-right font-mono text-xs">
        {thin ? (
          <span className="text-muted">—</span>
        ) : (
          `${bucket.winRatePercent}%`
        )}
      </td>
      <td className="w-[38%] min-w-[7rem] py-2 pl-2">
        <div className="flex items-center gap-2">
          {/* Read from the centre, so which side of break-even a bucket falls
              on is visible before any number is. */}
          <div className="relative h-2 flex-1">
            <span className="absolute left-1/2 top-0 h-full w-px bg-line" />
            {width > 0 ? (
              <span
                className={`absolute top-0 h-full rounded-sm ${
                  r > 0 ? "bg-positive/70" : "bg-negative/70"
                }`}
                style={
                  r > 0
                    ? { left: "50%", width: `${width}%` }
                    : { right: "50%", width: `${width}%` }
                }
              />
            ) : null}
          </div>
          <span
            className={`w-14 shrink-0 text-right font-mono text-xs tabular-nums ${toneFor(
              bucket.totalR,
            )}`}
          >
            {formatR(bucket.totalR)}
          </span>
        </div>
      </td>
    </tr>
  );
}

function BucketTable({
  caption,
  buckets,
  hints,
}: {
  caption: string;
  buckets: Bucket[];
  hints?: Record<string, string>;
}) {
  if (buckets.length === 0) return null;

  const scale = Math.max(
    ...buckets.map((bucket) => Math.abs(bucket.totalR ?? 0)),
    0,
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-muted">
            <th className="py-1 pr-3 text-left font-normal">{caption}</th>
            <th className="py-1 pr-3 text-right font-normal">Trades</th>
            <th className="py-1 pr-3 text-right font-normal">Win rate</th>
            <th className="py-1 pl-2 text-right font-normal">Total R</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <BucketRow
              key={bucket.key}
              bucket={bucket}
              hint={hints?.[bucket.key]}
              scale={scale}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function riskNote(pair: PairBreakdown): string | undefined {
  if (pair.riskVsOwnMedian === null) return undefined;
  if (pair.riskVsOwnMedian >= 1.25) {
    return `${pair.riskVsOwnMedian}× your usual stake`;
  }
  if (pair.riskVsOwnMedian <= 0.8) {
    return `${pair.riskVsOwnMedian}× your usual stake`;
  }
  return "in line with the rest of your book";
}

export default function PairAnalysis({ pair }: { pair: PairBreakdown }) {
  const thin = pair.scored < MIN_SAMPLE_FOR_RATE;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Trades"
          value={String(pair.trades)}
          note={
            pair.scored === pair.trades
              ? undefined
              : `${pair.scored} with an R-multiple`
          }
        />
        <Stat
          label="Win rate"
          value={thin ? "—" : `${pair.winRatePercent}%`}
          note={
            thin
              ? `needs ${MIN_SAMPLE_FOR_RATE} scored trades`
              : `${pair.scored} scored`
          }
        />
        <Stat
          label="Total R"
          value={formatR(pair.totalR)}
          tone={toneFor(pair.totalR)}
        />
        <Stat
          label="Expectancy"
          value={formatR(pair.expectancyR)}
          tone={toneFor(pair.expectancyR)}
          note="per trade"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Average win" value={formatR(pair.averageWinR)} />
        <Stat label="Average loss" value={formatR(pair.averageLossR)} />
        <Stat
          label="Worst"
          value={formatR(pair.worstLossR)}
          tone={toneFor(pair.worstLossR)}
        />
        <Stat
          label="Median risk"
          value={
            pair.medianRiskPercent === null
              ? "—"
              : `${pair.medianRiskPercent}%`
          }
          note={riskNote(pair)}
        />
      </div>

      {pair.withoutStop > 0 || pair.withoutNotes > 0 || pair.openTrades > 0 ? (
        <ul className="space-y-1 text-xs text-muted">
          {pair.openTrades > 0 ? (
            <li>
              {pair.openTrades} still open, so not counted in any result above.
            </li>
          ) : null}
          {pair.withoutStop > 0 ? (
            <li className="text-warning">
              {pair.withoutStop} taken without a stop. No defined risk means no
              R-multiple, so those trades are invisible to every figure here.
            </li>
          ) : null}
          {pair.withoutNotes > 0 ? (
            <li>
              {pair.withoutNotes} carry no written note. The numbers can say
              when it went wrong, never why.
            </li>
          ) : null}
        </ul>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <BucketTable
          caption="By session"
          buckets={pair.sessions}
          hints={SESSION_HOURS}
        />
        <BucketTable caption="By weekday" buckets={pair.weekdays} />
      </div>

      {pair.afterResult.length > 0 ? (
        <div>
          <BucketTable caption="By what came before" buckets={pair.afterResult} />
          <p className="mt-2 text-xs text-muted">
            &ldquo;Before&rdquo; means the previous trade anywhere in your
            journal, not only on this instrument — a loss on one pair is what
            you carry into the next one.
          </p>
        </div>
      ) : null}
    </div>
  );
}
