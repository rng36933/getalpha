import type { SourceResult } from "@/lib/market-data/types";

type Source = {
  /** What the reader would call this data, e.g. "Economic calendar". */
  label: string;
  result: Pick<SourceResult<unknown>, "status" | "fetchedAt">;
};

type DataQualityNoticeProps = {
  sources: Source[];
};

function formatAge(fetchedAt: string | null): string {
  if (!fetchedAt) return "unknown age";

  const minutes = Math.round((Date.now() - new Date(fetchedAt).getTime()) / 60_000);
  if (!Number.isFinite(minutes) || minutes < 1) return "moments ago";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
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
export default function DataQualityNotice({ sources }: DataQualityNoticeProps) {
  const degraded = sources.filter((s) => s.result.status !== "LIVE");
  if (degraded.length === 0) return null;

  const missing = degraded.filter((s) => s.result.status === "UNAVAILABLE");

  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
    >
      <p className="font-medium">
        Data may be temporarily incomplete or out of date
      </p>

      <ul className="mt-1 space-y-0.5 text-xs text-warning/80">
        {degraded.map((source) => (
          <li key={source.label}>
            {source.result.status === "CACHED"
              ? `${source.label}: provider unreachable, showing the last stored data (${formatAge(source.result.fetchedAt)}).`
              : `${source.label}: provider unreachable and nothing stored for today, so nothing is shown.`}
          </li>
        ))}
      </ul>

      {missing.length > 0 ? (
        <p className="mt-1 text-xs text-warning/80">
          Nothing is being guessed — a missing source is left blank rather than
          filled in.
        </p>
      ) : null}
    </div>
  );
}
