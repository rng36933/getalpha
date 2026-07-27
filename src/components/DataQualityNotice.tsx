import { sharedCopy } from "@/lib/i18n/app/shared";
import type { Locale } from "@/lib/i18n/locales";
import type { SourceResult } from "@/lib/market-data/types";

type Source = {
  /** What the reader would call this data, e.g. "Economic calendar". */
  label: string;
  result: Pick<SourceResult<unknown>, "status" | "fetchedAt">;
};

type DataQualityNoticeProps = {
  sources: Source[];
  /** Defaulted so Calendar and Macro Desk, not yet localised, keep compiling. */
  locale?: Locale;
};

function formatAge(
  fetchedAt: string | null,
  copy: ReturnType<typeof sharedCopy>["dataQuality"],
): string {
  if (!fetchedAt) return copy.unknownAge;

  const minutes = Math.round((Date.now() - new Date(fetchedAt).getTime()) / 60_000);
  if (!Number.isFinite(minutes) || minutes < 1) return copy.momentsAgo;
  if (minutes < 60) return copy.minutesAgo(minutes);

  const hours = Math.round(minutes / 60);
  return hours === 1 ? copy.hourAgo : copy.hoursAgo(hours);
}

/**
 * The one banner that says the page is not showing live data.
 *
 * Rendered instead of letting a provider failure throw: a page that half-works
 * and says so is more useful than an error boundary, and a trader reading stale
 * levels without being told is worse than either.
 *
 * Renders nothing when every source is live, so it can be dropped into any page
 * unconditionally.
 */
export default function DataQualityNotice({
  sources,
  locale = "en",
}: DataQualityNoticeProps) {
  const degraded = sources.filter((s) => s.result.status !== "LIVE");
  if (degraded.length === 0) return null;

  const missing = degraded.filter((s) => s.result.status === "UNAVAILABLE");
  const copy = sharedCopy(locale).dataQuality;

  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
    >
      <p className="font-medium">{copy.heading}</p>

      <ul className="mt-1 space-y-0.5 text-xs text-warning/80">
        {degraded.map((source) => (
          <li key={source.label}>
            {source.result.status === "CACHED"
              ? copy.cachedLine(
                  source.label,
                  formatAge(source.result.fetchedAt, copy),
                )
              : copy.unavailableLine(source.label)}
          </li>
        ))}
      </ul>

      {missing.length > 0 ? (
        <p className="mt-1 text-xs text-warning/80">{copy.nothingGuessed}</p>
      ) : null}
    </div>
  );
}
