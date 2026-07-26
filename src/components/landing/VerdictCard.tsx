/**
 * The example review in the hero.
 *
 * A winning trade rated as a broken process. Every competitor's landing page
 * opens with a green arrow; this product's whole argument is that a green
 * arrow proves nothing, so the page has to say that before anything else.
 *
 * Static content, deliberately. Generating a real review here would cost
 * eleven cents per visitor and could not be shown before somebody has trades.
 */

const SCORECARD = [
  { label: "Trade selection", rating: "ADEQUATE", tone: "text-foreground" },
  { label: "Position sizing", rating: "WEAK", tone: "text-negative" },
  { label: "Stop placement", rating: "WEAK", tone: "text-negative" },
  { label: "Exit management", rating: "ADEQUATE", tone: "text-foreground" },
  { label: "Plan adherence", rating: "WEAK", tone: "text-negative" },
  { label: "Emotional control", rating: "NOT ASSESSABLE", tone: "text-muted" },
] as const;

export default function VerdictCard() {
  return (
    <div>
      <article className="overflow-hidden rounded-xl border border-line bg-gradient-to-b from-surface to-background shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5">
          <div className="flex items-baseline gap-2.5 font-mono text-[13px]">
            <span className="rounded bg-positive/15 px-1.5 py-0.5 text-[11px] tracking-wide text-positive">
              BUY
            </span>
            <span className="font-medium">XAUUSD</span>
            <span className="tabular-nums text-positive">+$340.00</span>
          </div>

          <span className="rounded-md bg-negative/15 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-negative">
            Process broken
          </span>
        </header>

        <div className="p-4">
          <p className="text-[17px] leading-snug tracking-tight text-balance">
            Profitable, and taken at four times your median risk with no stop
            recorded. The result is not evidence the decision was right.
          </p>

          <dl className="mt-4">
            {SCORECARD.map((row, index) => (
              <div
                key={row.label}
                className="animate-row-in flex items-center justify-between gap-3 border-t border-line py-2 text-sm"
                style={{ animationDelay: `${260 + index * 70}ms` }}
              >
                <dt className="text-muted">{row.label}</dt>
                <dd className={`font-mono text-xs tracking-wide ${row.tone}`}>
                  {row.rating}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 rounded-lg border border-accent/30 bg-accent-soft px-3.5 py-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
              Rule for next time
            </p>
            <p className="mt-1.5 text-[15px] leading-snug">
              Record the stop before entry, and size so risk stays at or below
              1.2% of equity.
            </p>
          </div>
        </div>
      </article>

      {/* Said plainly rather than in small print: an invented account presented
          as a real one is the thing this product exists to argue against. */}
      <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
        Example review · not a real account
      </p>
    </div>
  );
}
