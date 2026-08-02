type CardProps = {
  title: string;
  /** Text shown inside the empty placeholder area. Ignored when children are given. */
  hint?: string;
  /** Extra classes, mainly for grid spans. */
  className?: string;
  /** Height of the placeholder area. Ignored when children are given. */
  height?: string;
  /**
   * Position in the arrival sequence, 0-based.
   *
   * Cards fade up in order rather than all together, which is the difference
   * between a page that appears and a page that arrives. Left at 0 the card
   * simply arrives first, so callers that do not care can ignore it.
   */
  enter?: number;
  /** Real content. When present it replaces the placeholder and the "Soon" badge. */
  children?: React.ReactNode;
};

export default function Card({
  title,
  hint = "Module placeholder",
  className = "",
  height = "h-44",
  enter = 0,
  children,
}: CardProps) {
  return (
    // Less inner padding on a phone: 20px of card padding inside 16px of page
    // padding spent a fifth of a 360-pixel screen on empty margin.
    //
    // `surface-lit` is the whole depth treatment — a lit top edge and a long
    // shadow, defined once in globals.css. It is what stops a page of these
    // reading as a wireframe.
    <section
      style={{ "--enter": enter } as React.CSSProperties}
      // `h-full` is what makes a row of cards line up: a grid row stretches
      // its cells to the tallest one by default, but nothing inside a cell
      // fills that height on its own, so a short card and a tall card side
      // by side kept their own content heights and left uneven bottoms.
      className={`surface-lit card-enter relative isolate flex h-full flex-col rounded-xl border border-line bg-surface p-4 sm:p-5 ${className}`}
    >
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-[0.9375rem] font-semibold tracking-tight">
          {title}
        </h2>
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
