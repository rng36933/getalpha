type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

/**
 * The one place a page states what it is.
 *
 * Larger and tighter than it was, and the subtitle is held to a readable
 * measure rather than running the full width of a desktop. The old version set
 * the title barely above the body text, which left every page opening with
 * nothing that claimed to be the top of it.
 */
export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="mb-6 sm:mb-7">
      <h1 className="text-2xl font-semibold tracking-[-0.03em] text-balance sm:text-[2rem] sm:leading-[1.1]">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-1.5 max-w-[52ch] text-[0.9375rem] leading-relaxed text-muted">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
