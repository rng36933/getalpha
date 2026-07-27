"use client";

import { journalCopy } from "@/lib/i18n/app/journal";
import type { Locale } from "@/lib/i18n/locales";
import type { CoachRating, CoachReview } from "@/lib/ai/types";

const VERDICT_CLASS: Record<CoachReview["verdict"], string> = {
  PROCESS_SOUND: "bg-positive/15 text-positive",
  PROCESS_MIXED: "bg-warning/15 text-warning",
  PROCESS_BROKEN: "bg-negative/15 text-negative",
};

const RATING_CLASS: Record<CoachRating, string> = {
  STRONG: "text-positive",
  ADEQUATE: "text-foreground",
  WEAK: "text-negative",
  NOT_ASSESSABLE: "text-muted",
};

export default function CoachReviewPanel({
  review,
  locale,
}: {
  review: CoachReview;
  locale: Locale;
}) {
  const copy = journalCopy(locale).coachPanel;

  const VERDICT: Record<CoachReview["verdict"], string> = {
    PROCESS_SOUND: copy.verdict.sound,
    PROCESS_MIXED: copy.verdict.mixed,
    PROCESS_BROKEN: copy.verdict.broken,
  };

  const RATING: Record<CoachRating, string> = {
    STRONG: copy.rating.strong,
    ADEQUATE: copy.rating.adequate,
    WEAK: copy.rating.weak,
    NOT_ASSESSABLE: copy.rating.notAssessable,
  };

  const DIMENSIONS: { key: keyof CoachReview["scorecard"]; label: string }[] = [
    { key: "tradeSelection", label: copy.dimensions.tradeSelection },
    { key: "positionSizing", label: copy.dimensions.positionSizing },
    { key: "stopPlacement", label: copy.dimensions.stopPlacement },
    { key: "exitManagement", label: copy.dimensions.exitManagement },
    { key: "planAdherence", label: copy.dimensions.planAdherence },
    { key: "emotionalControl", label: copy.dimensions.emotionalControl },
  ];

  const verdictClass = VERDICT_CLASS[review.verdict];

  return (
    <div className="space-y-5">
      <div>
        <span
          className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${verdictClass}`}
        >
          {VERDICT[review.verdict]}
        </span>
        <p className="mt-2 text-sm leading-relaxed">{review.headline}</p>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted">{copy.scorecard}</p>
        <dl className="mt-2 divide-y divide-line">
          {DIMENSIONS.map(({ key, label }) => {
            const dimension = review.scorecard[key];

            return (
              <div key={key} className="py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-sm">{label}</dt>
                  <dd className={`shrink-0 text-xs font-medium ${RATING_CLASS[dimension.rating]}`}>
                    {RATING[dimension.rating]}
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
            {copy.primaryLeak}
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
          <p className="text-[11px] uppercase tracking-wider text-muted">{copy.strengths}</p>
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
          {copy.ruleForNextTime}
        </p>
        <p className="mt-1 text-sm leading-relaxed">{review.ruleForNextTime}</p>
      </div>

      {review.missingData.length > 0 ? (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted">
            {copy.limitedByMissingData}
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
