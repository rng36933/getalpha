/**
 * The four fields a person may edit on a trade that already exists.
 *
 * Deliberately not the prices, the size or the times. A synced row belongs to
 * the terminal and the next sync overwrites everything it owns, so an edit to
 * an entry price would survive until the EA next spoke and then silently
 * revert. These four are the ones MetaTrader cannot supply and therefore never
 * sends: why the trade was taken, and how it felt taking it.
 */
export const EDITABLE_FIELDS = [
  "setup",
  "timeframe",
  "marketContext",
  "emotionalState",
] as const;

export type EditableField = (typeof EDITABLE_FIELDS)[number];

/** A short label; the long-form reflection lives in the two note fields. */
const MAX_LABEL_LENGTH = 120;
/** Long enough for the reasoning, short enough to keep an AI prompt honest. */
export const MAX_NOTE_LENGTH = 2000;

const MAX_LENGTH: Record<EditableField, number> = {
  setup: MAX_LABEL_LENGTH,
  timeframe: 32,
  marketContext: MAX_NOTE_LENGTH,
  emotionalState: MAX_NOTE_LENGTH,
};

export type NoteUpdate = Partial<Record<EditableField, string | null>>;

export type ParseResult =
  | { ok: true; update: NoteUpdate }
  | { ok: false; errors: string[] };

/**
 * Reads an edit off a request body, keeping only the fields above.
 *
 * An absent key means "leave it alone" and an empty string means "clear it",
 * which are different things: a form that always sends every field would
 * otherwise wipe the note the user did not touch.
 */
export function parseNoteUpdate(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, errors: ["Request body must be a JSON object"] };
  }

  const record = body as Record<string, unknown>;
  const errors: string[] = [];
  const update: NoteUpdate = {};

  for (const field of EDITABLE_FIELDS) {
    if (!(field in record)) continue;

    const value = record[field];

    if (value === null) {
      update[field] = null;
      continue;
    }

    if (typeof value !== "string") {
      errors.push(`${field}: must be a string or null`);
      continue;
    }

    const trimmed = value.trim();

    if (trimmed.length > MAX_LENGTH[field]) {
      errors.push(`${field}: must be at most ${MAX_LENGTH[field]} characters`);
      continue;
    }

    // Blank clears the field rather than storing "", so everything downstream
    // has one way to ask whether a note exists.
    update[field] = trimmed === "" ? null : trimmed;
  }

  if (errors.length > 0) return { ok: false, errors };

  if (Object.keys(update).length === 0) {
    return {
      ok: false,
      errors: [`Nothing to update. Editable fields: ${EDITABLE_FIELDS.join(", ")}`],
    };
  }

  return { ok: true, update };
}
