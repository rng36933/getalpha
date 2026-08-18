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
function age(publishedAt: string, asOf: string): string | null {
  const from = new Date(asOf).getTime();
  const at = new Date(publishedAt).getTime();

  if (Number.isNaN(from) || Number.isNaN(at)) return null;

  const minutes = Math.round((from - at) / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return days === 1 ? "1d ago" : `${days}d ago`;
}

export default function PairNews({
  headlines,
  label,
  asOf,
  emptyReason,
}: {
  headlines: NewsInput[];
  /** How the instrument is written in the app, e.g. "XAUUSD". */
  label: string;
  /** When the feed was read. Null when nothing could be fetched or stored. */
  asOf: string | null;
  /** Set when the feed itself failed, rather than simply having nothing. */
  emptyReason?: string;
}) {
  if (headlines.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        {emptyReason ??
          `Nothing in the last three days naming ${label} or its currencies. The feeds are read live; a quiet list is a quiet market, not a broken panel.`}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {headlines.map((headline) => {
        const when =
          (asOf ? age(headline.publishedAt, asOf) : null) ??
          headline.publishedAt.slice(11, 16);

        return (
          <li key={`${headline.source}-${headline.publishedAt}-${headline.title}`}>
            <div className="px-1 py-2.5 transition-colors hover:bg-white/[0.03]">
              <span className="font-mono text-[10px] text-muted uppercase">
                [{when}]
              </span>
              {headline.url ? (
                <a
                  href={headline.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 block font-mono text-sm leading-snug font-bold hover:text-accent hover:underline"
                >
                  {headline.title}
                </a>
              ) : (
                <p className="mt-0.5 font-mono text-sm leading-snug font-bold">
                  {headline.title}
                </p>
              )}
              <p className="mt-0.5 text-[11px] text-muted">{headline.source}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
