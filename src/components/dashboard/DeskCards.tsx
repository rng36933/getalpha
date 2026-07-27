import Link from "next/link";
import { dashboardCopy } from "@/lib/i18n/app/dashboard";
import type { Locale } from "@/lib/i18n/locales";
import { formatMoney, formatSignedMoney } from "@/lib/format/money";
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

function tone(value: number | null): string {
  if (value === null) return "text-muted";
  if (value > 0) return "text-positive";
  if (value < 0) return "text-negative";
  return "text-muted";
}

function pnl(value: number | null, currency: string | null): string {
  if (value === null) return "—";
  return formatSignedMoney(value, currency);
}

/* ------------------------------------------------------------------ open */

export function OpenPositions({
  positions,
  locale,
}: {
  positions: OpenPosition[];
  locale: Locale;
}) {
  const copy = dashboardCopy(locale).deskCards.openPositions;

  if (positions.length === 0) {
    return (
      <Empty>
        {copy.empty} <JournalLink label={copy.logOne} />.
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
              <span className="text-warning">{copy.noStop}</span>
            ) : (
              copy.riskPercent(position.riskPercent.toFixed(2))
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------- exposure */

export function RiskExposure({
  exposure,
  currency,
  locale,
}: {
  exposure: Exposure[];
  currency: string | null;
  locale: Locale;
}) {
  const copy = dashboardCopy(locale).deskCards.riskExposure;

  if (exposure.length === 0) {
    return <Empty>{copy.empty}</Empty>;
  }

  return (
    <ul className="space-y-3">
      {exposure.map((row) => (
        <li key={row.asset}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium">{row.asset}</span>
            <span className="font-mono text-xs tabular-nums text-muted">
              {formatMoney(row.riskAmount, currency)}
            </span>
          </div>

          <div
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-raised"
            role="img"
            aria-label={copy.shareAria(row.share)}
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

export function RecentTrades({
  trades,
  currency,
  locale,
}: {
  trades: ClosedTrade[];
  currency: string | null;
  locale: Locale;
}) {
  const copy = dashboardCopy(locale).deskCards.recentTrades;

  if (trades.length === 0) {
    return (
      <Empty>
        {copy.empty} <JournalLink label={copy.connectMetaTrader} />{" "}
        {copy.andTheyArrive}
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
            className={`shrink-0 font-mono text-xs tabular-nums ${tone(trade.pnl)}`}
          >
            {pnl(trade.pnl, currency)}
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
      <p className="eyebrow">{label}</p>
      <p className={`figure mt-1.5 text-[1.5rem] ${tone}`}>{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}

/**
 * A win rate given a shape as well as a number.
 *
 * A bar rather than a ring or a gauge: the quantity is a proportion of one whole
 * thing, and a straight line is the one form where "a bit over half" is legible
 * without reading the figure. The 50% mark is drawn because that is the number
 * this one gets compared against, and a rate with no reference is a number
 * floating on its own.
 */
function WinRateMeter({
  percent,
  copy,
}: {
  percent: number;
  copy: ReturnType<typeof dashboardCopy>["deskCards"]["performance"];
}) {
  return (
    <div className="mt-2">
      <div className="relative h-1.5 overflow-hidden rounded-full bg-surface-raised">
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${
            percent >= 50 ? "bg-positive/80" : "bg-negative/80"
          }`}
          style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
        />
        <span className="absolute inset-y-0 left-1/2 w-px bg-line" />
      </div>
      <p className="mt-1 text-[11px] text-muted">
        {percent >= 50 ? copy.aboveEvenSplit : copy.belowEvenSplit}
      </p>
    </div>
  );
}

/**
 * Gross win R against gross loss R, drawn as the two sides of the same bar.
 *
 * The profit factor is a ratio, and a ratio is the one thing a single bar cannot
 * show. Two segments of one bar can: how much of the total R moved was won and
 * how much was lost.
 */
function ProfitFactorBar({
  factor,
  copy,
}: {
  factor: number;
  copy: ReturnType<typeof dashboardCopy>["deskCards"]["performance"];
}) {
  // factor = win / loss, so the won share of the whole is factor / (factor + 1).
  const wonShare = (factor / (factor + 1)) * 100;

  return (
    <div className="mt-2">
      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        <span
          className="rounded-l-full bg-positive/80"
          style={{ width: `${wonShare}%` }}
        />
        <span className="flex-1 rounded-r-full bg-negative/80" />
      </div>
      <p className="mt-1 text-[11px] text-muted">
        {factor >= 1
          ? copy.wonPerLost(factor.toFixed(2))
          : copy.onlyWonPerLost(factor.toFixed(2))}
      </p>
    </div>
  );
}

export function PerformanceStats({
  performance,
  currency,
  locale,
}: {
  performance: Performance;
  currency: string | null;
  locale: Locale;
}) {
  const copy = dashboardCopy(locale).deskCards.performance;

  if (performance.closedCount === 0) {
    return (
      <Empty>
        {copy.empty} <JournalLink label={copy.openTheJournal} />.
      </Empty>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label={copy.closed}
          value={String(performance.closedCount)}
        />
        <div>
          <Stat
            label={copy.winRate}
            value={
              performance.winRatePercent === null
                ? "—"
                : `${performance.winRatePercent}%`
            }
          />
          {performance.winRatePercent !== null ? (
            <WinRateMeter percent={performance.winRatePercent} copy={copy} />
          ) : null}
        </div>
        <Stat
          label={copy.totalPnl}
          value={pnl(performance.totalPnl, currency)}
          tone={tone(performance.totalPnl)}
        />
        <div>
          <Stat
            label={copy.profitFactor}
            value={
              performance.profitFactor === null
                ? "—"
                : performance.profitFactor.toFixed(2)
            }
            tone={
              performance.profitFactor === null
                ? ""
                : performance.profitFactor >= 1
                  ? "text-positive"
                  : "text-negative"
            }
          />
          {performance.profitFactor === null ? (
            // Deliberately not infinity: no losses yet is a fact about the
            // sample, not about an edge.
            <p className="mt-1 text-[11px] text-muted">{copy.noLosingTradeYet}</p>
          ) : (
            <ProfitFactorBar factor={performance.profitFactor} copy={copy} />
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-line pt-3 text-xs text-muted">
        <span>
          {copy.expectancy}{" "}
          <span
            className={`font-mono tabular-nums ${tone(performance.expectancyPnl)}`}
          >
            {pnl(performance.expectancyPnl, currency)}
          </span>{" "}
          {copy.perTrade}
        </span>

        {performance.withoutStop > 0 ? (
          <span className="text-warning">
            {copy.withoutStop(performance.withoutStop)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
