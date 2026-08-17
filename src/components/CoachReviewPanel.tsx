"use client";

import type { CoachRating, CoachReview } from "@/lib/ai/types";

const VERDICT: Record<
  CoachReview["verdict"],
  { label: string; className: string }
> = {
  PROCESS_SOUND: { label: "Process sound", className: "bg-positive/15 text-positive" },
  PROCESS_MIXED: { label: "Process mixed", className: "bg-warning/15 text-warning" },
  PROCESS_BROKEN: { label: "Process broken", className: "bg-negative/15 text-negative" },
};

const RATING: Record<CoachRating, { label: string; className: string }> = {
  STRONG: { label: "Strong", className: "text-positive" },
  ADEQUATE: { label: "Adequate", className: "text-foreground" },
  WEAK: { label: "Weak", className: "text-negative" },
  NOT_ASSESSABLE: { label: "Not assessable", className: "text-muted" },
};

const DIMENSIONS: { key: keyof CoachReview["scorecard"]; label: string }[] = [
  { key: "positionSizing", label: "Position sizing" },
  { key: "stopPlacement", label: "Stop placement" },
  { key: "exitManagement", label: "Exit management" },
  { key: "planAdherence", label: "Plan adherence" },
];

export default function CoachReviewPanel({ review }: { review: CoachReview }) {
  const verdict = VERDICT[review.verdict];

  return (
    <div className="space-y-5">
      <div>
        <span
          className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${verdict.className}`}
        >
          {verdict.label}
        </span>
        <p className="mt-2 text-sm leading-relaxed">{review.headline}</p>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted">Scorecard</p>
        <dl className="mt-2 divide-y divide-line">
          {DIMENSIONS.map(({ key, label }) => {
            const dimension = review.scorecard[key];
            const rating = RATING[dimension.rating];

            return (
              <div key={key} className="py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-sm">{label}</dt>
                  <dd className={`shrink-0 text-xs font-medium ${rating.className}`}>
                    {rating.label}
                  </dd>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {dimension.note}
                </p>
              </div>
            );
          })}
        </dl>
      </div>

      {review.primaryLeak ? (
        <div className="rounded-lg border border-negative/30 bg-negative/10 p-3">
          <p className="text-[11px] uppercase tracking-wider text-negative">
            Primary leak
          </p>
          <p className="mt-1 text-sm font-medium">{review.primaryLeak.name}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {review.primaryLeak.evidence}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            {review.primaryLeak.costOverSample}
          </p>
        </div>
      ) : null}

      {review.strengths.length > 0 ? (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted">Strengths</p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted">
            {review.strengths.map((strength) => (
              <li key={strength} className="flex gap-2">
                <span aria-hidden="true" className="text-positive">
                  ✓
                </span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-lg border border-accent/30 bg-accent-soft p-3">
        <p className="text-[11px] uppercase tracking-wider text-accent">
          Rule for next time
        </p>
        <p className="mt-1 text-sm leading-relaxed">{review.ruleForNextTime}</p>
      </div>

      {review.missingData.length > 0 ? (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted">
            Limited by missing data
          </p>
          {/* Named rather than hidden: a reader should be able to tell the
              difference between "your sizing was fine" and "nobody could
              tell", and fixing the record is the cheapest way to a better
              review next time. */}
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {review.missingData.join(", ")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
