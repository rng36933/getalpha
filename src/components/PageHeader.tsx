type PageHeaderProps = {
  title: string;
  subtitle?: string;
  /**
   * Optional content for the header's right side. The title and subtitle are
   * held to a readable measure, which on most pages leaves real width doing
   * nothing beside them on desktop — a slot for a page-specific callout
   * (a quota, a status) that would otherwise get buried as a small line
   * under the subtitle instead of claimed space of its own.
   */
  aside?: React.ReactNode;
};

/**
 * The one place a page states what it is.
 *
 * Larger and tighter than it was, and the subtitle is held to a readable
 * measure rather than running the full width of a desktop. The old version set
 * the title barely above the body text, which left every page opening with
 * nothing that claimed to be the top of it.
 */
export default function PageHeader({ title, subtitle, aside }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-balance sm:text-[2rem] sm:leading-[1.1]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-[52ch] text-[0.9375rem] leading-relaxed text-muted">
            {subtitle}
          </p>
        ) : null}
      </div>
      {aside ? <div className="shrink-0 sm:pt-1">{aside}</div> : null}
    </header>
  );
}
