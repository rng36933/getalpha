import type { Metadata } from "next";
import {
  overallStatus,
  runStatusChecks,
  type ComponentStatus,
} from "@/lib/status/checks";

export const metadata: Metadata = {
  title: { absolute: "Status · getALPHA" },
  description: "Live status of getALPHA's website, database, and payments.",
  alternates: { canonical: "/status" },
};

// Always a fresh read — a cached "all systems operational" during an actual
// outage would be worse than no status page at all.
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<ComponentStatus, string> = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Down",
};

const STATUS_COLOR: Record<ComponentStatus, string> = {
  operational: "text-emerald-400",
  degraded: "text-amber-400",
  down: "text-rose-400",
};

const STATUS_DOT: Record<ComponentStatus, string> = {
  operational: "bg-emerald-400",
  degraded: "bg-amber-400",
  down: "bg-rose-400",
};

const OVERALL_MESSAGE: Record<ComponentStatus, string> = {
  operational: "All systems operational",
  degraded: "Some systems degraded",
  down: "Major outage",
};

export default async function StatusPage() {
  const checks = await runStatusChecks();
  const overall = overallStatus(checks);

  return (
    <div>
      <h1 className="font-mono text-2xl font-bold tracking-tight text-white">
        Status
      </h1>

      <div className="mt-8 flex items-center gap-3 border border-line p-4">
        <span
          aria-hidden="true"
          className={`size-2.5 shrink-0 rounded-full ${STATUS_DOT[overall]}`}
        />
        <p className={`font-mono text-sm font-semibold ${STATUS_COLOR[overall]}`}>
          {OVERALL_MESSAGE[overall]}
        </p>
      </div>

      <ul className="mt-6 divide-y divide-line border border-line">
        {checks.map((check) => (
          <li
            key={check.name}
            className="flex items-center justify-between gap-4 px-4 py-4"
          >
            <div>
              <p className="text-sm font-semibold text-white">{check.name}</p>
              <p className="mt-0.5 text-xs text-muted">{check.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`size-2 shrink-0 rounded-full ${STATUS_DOT[check.status]}`}
              />
              <span
                className={`font-mono text-xs font-semibold uppercase tracking-widest ${STATUS_COLOR[check.status]}`}
              >
                {STATUS_LABEL[check.status]}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-6 font-mono text-xs text-muted">
        Checked live on every page load. Reload to re-check.
      </p>
    </div>
  );
}
