/** Long enough for a real bug report, short enough not to be a payload. */
export const MAX_MESSAGE_LENGTH = 2000;

export const MAX_PAGE_URL_LENGTH = 300;

/**
 * Code points stripped from a stored message.
 *
 * Built from numbers rather than written as a character class, because the
 * characters being matched here are by definition ones you cannot see. A
 * literal control character in source is invisible in every editor and diff,
 * survives copy-paste unpredictably, and gives the next reader no way to tell
 * what the expression actually matches.
 */
const STRIPPED_RANGES: [number, number][] = [
  // C0 controls, keeping tab (9), newline (10) and carriage return (13).
  [0x00, 0x08],
  [0x0b, 0x0c],
  [0x0e, 0x1f],
  // DEL and the C1 controls.
  [0x7f, 0x9f],
  // Zero-width space, non-joiner, joiner, and the LTR/RTL marks.
  [0x200b, 0x200f],
  // Bidirectional embedding and override characters, which make displayed text
  // read differently from what is stored.
  [0x202a, 0x202e],
  [0x2066, 0x2069],
  // Zero-width no-break space, better known as a stray byte-order mark.
  [0xfeff, 0xfeff],
];

const STRIPPED = new RegExp(
  `[${STRIPPED_RANGES.map(
    ([from, to]) =>
      `\\u{${from.toString(16)}}-\\u{${to.toString(16)}}`,
  ).join("")}]`,
  "gu",
);

/**
 * Cleans a message before it is stored.
 *
 * What this is not: XSS protection. React escapes everything it renders, so a
 * `<script>` in a message is displayed as the characters `<script>` and never
 * executes. Stripping tags here would be theatre, and worse, it would mangle a
 * bug report that legitimately quotes markup — which is most of them.
 *
 * What it is: removing characters that break the message somewhere else. They
 * survive a database happily and then corrupt a terminal, a CSV export, or an
 * email that quotes the text, and none of them is ever meaningful in something
 * a person typed.
 */
export function cleanMessage(raw: string): string {
  return raw
    .replace(STRIPPED, "")
    .replace(/\r\n?/g, "\n")
    // Collapse runs of blank lines rather than storing a screenful of them.
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

/**
 * Keeps a page path only if it is one of ours.
 *
 * The field is filled in by the browser, and a browser can be told to send
 * anything. An arbitrary URL stored here would be rendered as a link in
 * whatever view eventually reads these rows.
 */
export function cleanPageUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  const trimmed = raw.trim().slice(0, MAX_PAGE_URL_LENGTH);

  // A rooted path, not a full URL: no scheme, no host, and not "//host", which
  // a browser resolves as a protocol-relative URL to somewhere else entirely.
  if (trimmed.startsWith("//")) return null;

  return /^\/[A-Za-z0-9\-._~/?=&%]*$/.test(trimmed) ? trimmed : null;
}
