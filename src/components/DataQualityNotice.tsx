import { AlertCircle, AlertTriangle, Wifi, WifiOff } from "lucide-react";
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
 * Visual data quality notice with better icons and status indicators.
 *
 * Shows live/cached/unavailable status clearly with visual cues so new users
 * understand what data they're looking at.
 *
 * Renders nothing when every source is live.
 */
export default function DataQualityNotice({ sources }: DataQualityNoticeProps) {
  const degraded = sources.filter((s) => s.result.status !== "LIVE");
  if (degraded.length === 0) return null;

  const cached = degraded.filter((s) => s.result.status === "CACHED");
  const missing = degraded.filter((s) => s.result.status === "UNAVAILABLE");

  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-warning/30 bg-warning/5 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 pt-0.5">
          <AlertTriangle className="size-5 text-warning" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-warning">
            ⚠️ Data Quality Notice
          </h3>

          <p className="mt-2 text-sm text-muted leading-relaxed">
            Some data sources aren&apos;t live. Here&apos;s what you&apos;re looking at:
          </p>

          {/* Cached sources */}
          {cached.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <Wifi size={14} />
                Last Stored Data (Updated):
              </div>
              <ul className="ml-6 space-y-1">
                {cached.map((source) => (
                  <li key={source.label} className="text-xs text-muted">
                    <span className="text-foreground font-medium">
                      {source.label}
                    </span>{" "}
                    — {formatAge(source.result.fetchedAt)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing sources */}
          {missing.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
                <WifiOff size={14} />
                Unavailable (Nothing Shown):
              </div>
              <ul className="ml-6 space-y-1">
                {missing.map((source) => (
                  <li key={source.label} className="text-xs text-muted">
                    <span className="text-foreground font-medium">
                      {source.label}
                    </span>{" "}
                    — No data available today
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 p-2.5">
            <AlertCircle size={14} className="text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted">
              No data is guessed or filled in. Missing sources stay blank so you see exactly what&apos;s real.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
