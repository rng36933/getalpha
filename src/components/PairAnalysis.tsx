import {
  MIN_SAMPLE_FOR_RATE,
  SESSION_HOURS,
  type Bucket,
  type PairBreakdown,
} from "@/lib/analysis/per-pair";
import { formatSignedMoney } from "@/lib/format/money";
import { pairsCopy, type PairsCopy } from "@/lib/i18n/app/pairs";
import type { Locale } from "@/lib/i18n/locales";

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
  copy,
}: {
  caption: string;
  buckets: Bucket[];
  hints?: Record<string, string>;
  currency: string | null;
  copy: PairsCopy;
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
            <th className="py-1 pr-3 text-right font-normal">
              {copy.buckets.trades}
            </th>
            <th className="py-1 pr-3 text-right font-normal">
              {copy.buckets.winRate}
            </th>
            <th className="py-1 pl-2 text-right font-normal">
              {copy.buckets.totalPnl}
            </th>
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

function riskNote(pair: PairBreakdown, copy: PairsCopy): string | undefined {
  if (pair.riskVsOwnMedian === null) return undefined;
  if (pair.riskVsOwnMedian >= 1.25) {
    return copy.riskNote.times(pair.riskVsOwnMedian);
  }
  if (pair.riskVsOwnMedian <= 0.8) {
    return copy.riskNote.times(pair.riskVsOwnMedian);
  }
  return copy.riskNote.inLine;
}

export default function PairAnalysis({
  pair,
  currency,
  locale,
}: {
  pair: PairBreakdown;
  currency: string | null;
  locale: Locale;
}) {
  const copy = pairsCopy(locale);
  const thin = pair.scored < MIN_SAMPLE_FOR_RATE;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label={copy.stats.trades}
          value={String(pair.trades)}
          note={
            pair.scored === pair.trades
              ? undefined
              : copy.stats.closedNote(pair.scored)
          }
        />
        <Stat
          label={copy.stats.winRate}
          value={thin ? "—" : `${pair.winRatePercent}%`}
          note={
            thin
              ? copy.stats.needsScored(MIN_SAMPLE_FOR_RATE)
              : copy.stats.scoredNote(pair.scored)
          }
        />
        <Stat
          label={copy.stats.totalPnl}
          value={money(pair.totalPnl, currency)}
          tone={toneFor(pair.totalPnl)}
        />
        <Stat
          label={copy.stats.expectancy}
          value={money(pair.expectancyPnl, currency)}
          tone={toneFor(pair.expectancyPnl)}
          note={copy.stats.perTrade}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Days, not trades, and both of them. Three losses in a morning is a
            worse day than one large one, which the single-trade figure could
            not show at all — and the two days side by side are the range this
            instrument actually puts you through. A worst day three times the
            best is a different instrument from one where they match. */}
        <Stat
          label={copy.stats.bestDay}
          value={
            pair.bestDay === null ? "—" : money(pair.bestDay.total, currency)
          }
          tone={toneFor(pair.bestDay?.total ?? null)}
          note={
            pair.bestDay === null
              ? copy.stats.noDayUp
              : copy.stats.dayNote(pair.bestDay.date, pair.bestDay.trades)
          }
        />
        <Stat
          label={copy.stats.worstDay}
          value={
            pair.worstDay === null ? "—" : money(pair.worstDay.total, currency)
          }
          tone={toneFor(pair.worstDay?.total ?? null)}
          note={
            pair.worstDay === null
              ? copy.stats.noDayDown
              : copy.stats.worstDayNote(
                  pair.worstDay.date,
                  pair.worstDay.trades,
                  money(pair.worstLoss, currency),
                )
          }
        />
        {/* Paired into one tile so the two days can sit beside each other
            without pushing the grid to five across. They are read together
            anyway — an average win smaller than the average loss is the
            finding, not either number on its own. */}
        <Stat
          compact
          label={copy.stats.averageWinLoss}
          value={`${money(pair.averageWin, currency)} / ${money(
            pair.averageLoss,
            currency,
          )}`}
        />
        <Stat
          label={copy.stats.medianRisk}
          value={
            pair.medianRiskPercent === null
              ? "—"
              : `${pair.medianRiskPercent}%`
          }
          note={riskNote(pair, copy)}
        />
      </div>

      {pair.withoutStop > 0 || pair.withoutNotes > 0 || pair.openTrades > 0 ? (
        <ul className="space-y-1 text-xs text-muted">
          {pair.openTrades > 0 ? (
            <li>{copy.summary.stillOpen(pair.openTrades)}</li>
          ) : null}
          {pair.withoutStop > 0 ? (
            <li className="text-warning">
              {copy.summary.withoutStop(pair.withoutStop)}
            </li>
          ) : null}
          {pair.withoutNotes > 0 ? (
            <li>{copy.summary.withoutNotes(pair.withoutNotes)}</li>
          ) : null}
        </ul>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <BucketTable
          caption={copy.buckets.bySession}
          buckets={pair.sessions}
          hints={SESSION_HOURS}
          currency={currency}
          copy={copy}
        />
        <BucketTable
          caption={copy.buckets.byWeekday}
          buckets={pair.weekdays}
          currency={currency}
          copy={copy}
        />
      </div>

      {pair.afterResult.length > 0 ? (
        <div>
          <BucketTable
            caption={copy.buckets.byPrior}
            buckets={pair.afterResult}
            currency={currency}
            copy={copy}
          />
          <p className="mt-2 text-xs text-muted">{copy.buckets.priorNote}</p>
        </div>
      ) : null}
    </div>
  );
}
