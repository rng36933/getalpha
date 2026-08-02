import {
  MIN_SAMPLE_FOR_RATE,
  SESSION_HOURS,
  type Bucket,
  type PairBreakdown,
} from "@/lib/analysis/per-pair";
import { formatSignedMoney } from "@/lib/format/money";

/** Always signed, because a sign reads faster than a colour alone. */
function money(value: number | null, currency: string | null): string {
  if (value === null) return "—";
  return formatSignedMoney(value, currency);
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
  compact = false,
}: {
  label: string;
  value: string;
  tone?: string;
  note?: string;
  /**
   * For a tile holding two figures rather than one.
   *
   * At the headline size a pair like "+€340.00 / −€120.50" runs past the edge
   * of a half-width tile on a phone, and a measurement that has to be scrolled
   * to is not a measurement anybody reads.
   */
  compact?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-raised px-3 py-2.5">
      <p className="eyebrow">{label}</p>
      <p
        className={`figure mt-1.5 break-words ${
          compact ? "text-[0.95rem] sm:text-[1.1rem]" : "text-[1.2rem] sm:text-[1.4rem]"
        } ${tone}`}
      >
        {value}
      </p>
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
  currency,
}: {
  bucket: Bucket;
  hint?: string;
  /** Largest absolute total in this table, so bars share one scale. */
  scale: number;
  currency: string | null;
}) {
  const thin = bucket.scored < MIN_SAMPLE_FOR_RATE;
  const total = bucket.totalPnl ?? 0;
  // Both sides measured against the same number, or a small loss would look the
  // same length as a large win and the chart would be worse than the text.
  const width = scale > 0 ? (Math.abs(total) / scale) * 50 : 0;

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
                  total > 0 ? "bg-positive/70" : "bg-negative/70"
                }`}
                style={
                  total > 0
                    ? { left: "50%", width: `${width}%` }
                    : { right: "50%", width: `${width}%` }
                }
              />
            ) : null}
          </div>
          <span
            className={`w-14 shrink-0 text-right font-mono text-xs tabular-nums ${toneFor(
              bucket.totalPnl,
            )}`}
          >
            {money(bucket.totalPnl, currency)}
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
  currency,
}: {
  caption: string;
  buckets: Bucket[];
  hints?: Record<string, string>;
  currency: string | null;
}) {
  if (buckets.length === 0) return null;

  const scale = Math.max(
    ...buckets.map((bucket) => Math.abs(bucket.totalPnl ?? 0)),
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
            <th className="py-1 pl-2 text-right font-normal">Total P&L</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <BucketRow
              key={bucket.key}
              bucket={bucket}
              hint={hints?.[bucket.key]}
              scale={scale}
              currency={currency}
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

export default function PairAnalysis({
  pair,
  currency,
}: {
  pair: PairBreakdown;
  currency: string | null;
}) {
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
              : `${pair.scored} closed`
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
          label="Total P&L"
          value={money(pair.totalPnl, currency)}
          tone={toneFor(pair.totalPnl)}
        />
        <Stat
          label="Expectancy"
          value={money(pair.expectancyPnl, currency)}
          tone={toneFor(pair.expectancyPnl)}
          note="per trade"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Days, not trades, and both of them. Three losses in a morning is a
            worse day than one large one, which the single-trade figure could
            not show at all — and the two days side by side are the range this
            instrument actually puts you through. A worst day three times the
            best is a different instrument from one where they match. */}
        <Stat
          label="Best day"
          value={
            pair.bestDay === null ? "—" : money(pair.bestDay.total, currency)
          }
          tone={toneFor(pair.bestDay?.total ?? null)}
          note={
            pair.bestDay === null
              ? "no day finished up"
              : `${pair.bestDay.date} · ${pair.bestDay.trades} trade${
                  pair.bestDay.trades === 1 ? "" : "s"
                }`
          }
        />
        <Stat
          label="Worst day"
          value={
            pair.worstDay === null ? "—" : money(pair.worstDay.total, currency)
          }
          tone={toneFor(pair.worstDay?.total ?? null)}
          note={
            pair.worstDay === null
              ? "no day finished down"
              : `${pair.worstDay.date} · ${pair.worstDay.trades} trade${
                  pair.worstDay.trades === 1 ? "" : "s"
                } · worst single ${money(pair.worstLoss, currency)}`
          }
        />
        {/* Paired into one tile so the two days can sit beside each other
            without pushing the grid to five across. They are read together
            anyway — an average win smaller than the average loss is the
            finding, not either number on its own. */}
        <Stat
          compact
          label="Average win / loss"
          value={`${money(pair.averageWin, currency)} / ${money(
            pair.averageLoss,
            currency,
          )}`}
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

      <BucketTable
        caption="By session"
        buckets={pair.sessions}
        hints={SESSION_HOURS}
        currency={currency}
      />
    </div>
  );
}
