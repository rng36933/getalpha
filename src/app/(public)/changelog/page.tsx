import type { Metadata } from "next";
import { CHANGELOG } from "@/lib/changelog";

export const metadata: Metadata = {
  title: "Changelog · getALPHA",
  description: "What's shipped on getALPHA, newest first.",
};

function dateLabel(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default function ChangelogPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Changelog</h1>

      <ol className="mt-8 space-y-8 border-l border-line pl-6">
        {CHANGELOG.map((entry) => (
          <li key={`${entry.date}-${entry.title}`} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[1.65rem] top-1.5 size-2 rounded-full bg-accent"
            />
            <p className="font-mono text-xs uppercase tracking-wider text-muted">
              {dateLabel(entry.date)}
            </p>
            <h2 className="mt-1 text-base font-semibold tracking-tight">
              {entry.title}
            </h2>
            {entry.body ? (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
                {entry.body}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
