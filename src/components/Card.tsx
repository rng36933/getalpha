type CardProps = {
  title: string;
  /** Text shown inside the empty placeholder area. Ignored when children are given. */
  hint?: string;
  /** Extra classes, mainly for grid spans. */
  className?: string;
  /** Height of the placeholder area. Ignored when children are given. */
  height?: string;
  /** Real content. When present it replaces the placeholder and the "Soon" badge. */
  children?: React.ReactNode;
};

export default function Card({
  title,
  hint = "Module placeholder",
  className = "",
  height = "h-44",
  children,
}: CardProps) {
  return (
    // Less inner padding on a phone: 20px of card padding inside 16px of page
    // padding spent a fifth of a 360-pixel screen on empty margin.
    <section
      className={`rounded-xl border border-line bg-surface p-4 sm:p-5 ${className}`}
    >
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">{title}</h2>
        {children ? null : (
          <span className="rounded-md bg-surface-raised px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
            Soon
          </span>
        )}
      </header>

      {children ? (
        <div className="mt-4">{children}</div>
      ) : (
        <div
          className={`mt-4 grid ${height} place-items-center rounded-lg border border-dashed border-line text-xs text-muted`}
        >
          {hint}
        </div>
      )}
    </section>
  );
}
