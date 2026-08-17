import type { Metadata } from "next";
import Link from "next/link";
import { CHANGELOG } from "@/lib/changelog";

export const metadata: Metadata = {
  title: { absolute: "Changelog · getALPHA" },
  description: "What's shipped on getALPHA, newest first.",
  alternates: { canonical: "/changelog" },
};

/** Entries per page. Matches the journal's own page size. */
const PER_PAGE = 10;

function dateLabel(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default async function ChangelogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: requested } = await searchParams;

  const pageCount = Math.max(1, Math.ceil(CHANGELOG.length / PER_PAGE));

  // An out-of-range or non-numeric `?page=` falls back to page 1 rather than
  // an error — a stale bookmark to a page that no longer exists should still
  // show something true.
  const parsed = Number(requested);
  const page =
    Number.isInteger(parsed) && parsed >= 1 && parsed <= pageCount ? parsed : 1;

  const start = (page - 1) * PER_PAGE;
  const visible = CHANGELOG.slice(start, start + PER_PAGE);

  return (
    <div>
      <h1 className="font-mono text-2xl font-bold tracking-tight text-white">Changelog</h1>

      <ol className="mt-8 space-y-8 border-l border-line pl-6">
        {visible.map((entry) => (
          <li key={`${entry.date}-${entry.title}`} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[1.65rem] top-1.5 size-2 rounded-none bg-accent"
            />
            <p className="font-mono text-xs uppercase tracking-widest text-[#f2c94c]">
              {dateLabel(entry.date)}
            </p>
            <h2 className="mt-1 font-mono text-base font-bold text-white">
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

      {pageCount > 1 ? (
        <nav
          aria-label="Changelog pages"
          className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-5 text-sm"
        >
          {page > 1 ? (
            <Link href={`/changelog?page=${page - 1}`} className="text-accent hover:underline">
              ← Newer
            </Link>
          ) : (
            <span />
          )}

          <span className="font-mono text-xs text-muted">
            Page {page} of {pageCount}
          </span>

          {page < pageCount ? (
            <Link href={`/changelog?page=${page + 1}`} className="text-accent hover:underline">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
