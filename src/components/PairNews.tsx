import { dashboardCopy } from "@/lib/i18n/app/dashboard";
import type { Locale } from "@/lib/i18n/locales";
import type { NewsInput } from "@/lib/ai/types";

/**
 * Headlines that name this instrument, newest first.
 *
 * Shown, not scored. The list is filtered for relevance and left alone
 * otherwise — a reader takes the meaning of "gold slips as the dollar firms"
 * from the sentence faster than any word tally could, and a tally that got it
 * backwards would be worse than no tally at all.
 */

/**
 * How old a headline was when the feed was read.
 *
 * Measured against the fetch time rather than against the clock, and not only
 * to keep the render pure: the feed is read on this request, so the two agree,
 * and when a stored fallback is being shown the ages stay honest about the
 * moment the data describes instead of drifting with the page.
 */
function age(
  publishedAt: string,
  asOf: string,
  copy: ReturnType<typeof dashboardCopy>["newsCard"],
): string | null {
  const from = new Date(asOf).getTime();
  const at = new Date(publishedAt).getTime();

  if (Number.isNaN(from) || Number.isNaN(at)) return null;

  const minutes = Math.round((from - at) / 60_000);

  if (minutes < 1) return copy.justNow;
  if (minutes < 60) return copy.minutesAgo(minutes);

  const hours = Math.round(minutes / 60);
  if (hours < 24) return copy.hoursAgo(hours);

  const days = Math.round(hours / 24);
  return days === 1 ? copy.oneDayAgo : copy.daysAgo(days);
}

export default function PairNews({
  headlines,
  label,
  asOf,
  emptyReason,
  locale,
}: {
  headlines: NewsInput[];
  /** How the instrument is written in the app, e.g. "XAUUSD". */
  label: string;
  /** When the feed was read. Null when nothing could be fetched or stored. */
  asOf: string | null;
  /** Set when the feed itself failed, rather than simply having nothing. */
  emptyReason?: string;
  locale: Locale;
}) {
  const copy = dashboardCopy(locale).newsCard;

  if (headlines.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        {emptyReason ?? copy.empty(label)}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {headlines.map((headline) => (
        <li key={`${headline.source}-${headline.publishedAt}-${headline.title}`}>
          <div className="flex items-baseline gap-3 py-2.5">
            <span className="w-16 shrink-0 font-mono text-[11px] text-muted">
              {(asOf ? age(headline.publishedAt, asOf, copy) : null) ??
                headline.publishedAt.slice(11, 16)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">{headline.title}</p>
              <p className="mt-0.5 text-[11px] text-muted">{headline.source}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
