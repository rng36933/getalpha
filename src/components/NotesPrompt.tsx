import { journalCopy } from "@/lib/i18n/app/journal";
import type { Locale } from "@/lib/i18n/locales";

/**
 * The one thing the terminal cannot send, asked for on the page where it is
 * entered.
 *
 * MetaTrader knows what somebody did: the instrument, the size, the stop, the
 * result. It cannot know why they did it. Without that, the AI Coach reviews
 * arithmetic — correct arithmetic, and the least valuable thing it can offer.
 * "You risked 3.1% against a median of 1.2%" is a fact the trader could have
 * found alone; "you said you would wait for the retest and entered on the
 * break" is not.
 *
 * So this is not a tip. It is the difference between the paid module being
 * worth its price and not, and every account starts on the wrong side of it —
 * a synced journal arrives with hundreds of trades and zero notes.
 *
 * Written like `Mt5Prompt` and for the same reasons: it counts this person's
 * own record rather than talking in general, and it disappears once they have
 * the habit. A prompt that stays up after being acted on stops being a prompt
 * and becomes furniture.
 */

/** Above this many, the habit exists and the prompt has done its job. */
export const NOTES_HABIT_THRESHOLD = 10;

type NotesPromptProps = {
  /** Closed trades in the journal. */
  total: number;
  /** How many of them carry at least one written note. */
  withNotes: number;
  locale: Locale;
};

export default function NotesPrompt({ total, withNotes, locale }: NotesPromptProps) {
  // Nothing to ask for yet — the journal is empty, and `Mt5Prompt` is the one
  // with something useful to say at that point.
  if (total === 0) return null;
  if (withNotes >= NOTES_HABIT_THRESHOLD) return null;

  const copy = journalCopy(locale).notesPrompt;

  return (
    <section className="surface-lit mb-4 rounded-xl border border-warning/30 p-4 sm:p-5">
      <p className="eyebrow text-warning">
        {withNotes === 0
          ? copy.noneExplained(total)
          : copy.someExplained(withNotes, total)}
      </p>

      <h2 className="mt-1.5 max-w-[38ch] text-base font-semibold tracking-tight text-balance sm:text-lg">
        {copy.heading}
      </h2>

      <p className="mt-1.5 max-w-[62ch] text-[13px] leading-relaxed text-muted">
        {copy.bodyLead}
        <span className="text-foreground">{copy.bodyEmphasis}</span>
      </p>

      <ul className="mt-3 flex flex-col gap-2">
        {copy.reasons.map((reason) => (
          <li
            key={reason}
            className="grid grid-cols-[0.9rem_1fr] gap-2 text-[13px] leading-snug text-muted"
          >
            <span aria-hidden="true" className="text-warning">
              →
            </span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>

      <p className="mt-3.5 text-[13px] text-muted">
        {copy.footerLead} <span className="text-foreground">{copy.footerButton}</span>{" "}
        {copy.footerTail}
      </p>
    </section>
  );
}
