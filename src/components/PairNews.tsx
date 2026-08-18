import type { NewsInput } from "@/lib/ai/types";

/**
 * A monogram standing in for a source's logo — no favicon fetch, so no
 * third-party request per headline and nothing to break when a source
 * doesn't have one. Colour is picked deterministically from the source
 * name, from the same tokens used everywhere else, so a repeat source
 * (most of this feed is a handful of the same few outlets) reads as the
 * same badge every time rather than reshuffling on each render.
 */
const SOURCE_TONES = ["text-accent", "text-positive", "text-warning", "text-muted"] as const;

function sourceTone(source: string): (typeof SOURCE_TONES)[number] {
  const hash = [...source].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return SOURCE_TONES[hash % SOURCE_TONES.length];
}

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
    <ul className="flex flex-col gap-1">
      {headlines.map((headline) => {
        const when =
          (asOf ? age(headline.publishedAt, asOf) : null) ??
          headline.publishedAt.slice(11, 16);

        const tone = sourceTone(headline.source);

        return (
          <li key={`${headline.source}-${headline.publishedAt}-${headline.title}`}>
            <div className="px-1 py-2.5 transition-colors hover:bg-white/[0.03]">
              <span className="font-mono text-[10px] text-muted uppercase">
                {when}
              </span>
              {headline.url ? (
                <a
                  href={headline.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-sm leading-snug font-semibold hover:text-accent hover:underline"
                >
                  {headline.title}
                </a>
              ) : (
                <p className="mt-1 text-sm leading-snug font-semibold">
                  {headline.title}
                </p>
              )}
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                <span
                  aria-hidden="true"
                  className={`grid size-3.5 shrink-0 place-items-center bg-surface-raised font-mono text-[9px] font-bold ${tone}`}
                >
                  {headline.source.charAt(0).toUpperCase()}
                </span>
                {headline.source}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
