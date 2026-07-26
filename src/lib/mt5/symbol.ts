/**
 * Broker symbol suffixes, removed on the way in.
 *
 * A terminal reports what its broker calls the instrument, and brokers append
 * their own marker: PU Prime sends `XAUUSD.s`, others use `.a`, `.raw`, `.pro`,
 * `.ecn`, `_m`, `#`, or nothing at all. Left alone, three real problems follow
 * from one cosmetic difference:
 *
 * - The per-pair breakdown splits one instrument in two. A trade typed by hand
 *   as XAUUSD and the same pair synced as XAUUSD.s become separate rows with
 *   separate win rates, each computed from half the evidence.
 * - The calendar filter finds no currencies in `XAUUSD.S`, because the parser
 *   splits on non-letters and `XAUUSD` is not a currency code. That pair's
 *   calendar comes back empty.
 * - The news filter loses "gold" for the same reason, so a headline about the
 *   instrument does not match the instrument.
 *
 * Normalising on ingest rather than on display: the stored value is what every
 * later query, grouping and join uses, and a display-time fix would leave the
 * database holding two names for one thing.
 *
 * No imports, so `npm test` reaches it directly.
 */

/**
 * Suffixes that are broker decoration rather than part of the instrument.
 *
 * A list rather than a pattern like `\.[a-z]+$`. That pattern would also eat
 * the real thing: `US30.cash` and `BTC.d` are one broker's decoration and
 * another's actual product name, and a symbol nobody recognises is worse than a
 * symbol with a suffix on it. When in doubt this leaves the value alone.
 */
const SUFFIXES = [
  ".s", ".a", ".b", ".c", ".e", ".i", ".m", ".p", ".r", ".x", ".z",
  ".pro", ".ecn", ".raw", ".std", ".stp", ".cfd", ".spot", ".fx",
  "_s", "_a", "_m", "_ecn", "_raw", "_pro",
  "-s", "-a", "-m", "-ecn", "-raw", "-pro",
];

/**
 * The instrument behind a broker's symbol.
 *
 * Upper-cased, because the same broker sends `XAUUSD.s` and `XAUUSD.S`
 * depending on where the string came from, and two casings of one instrument
 * would split a journal exactly as two suffixes would.
 */
export function normaliseSymbol(raw: string): string {
  const upper = raw.trim().toUpperCase();
  if (upper === "") return upper;

  for (const suffix of SUFFIXES) {
    const marker = suffix.toUpperCase();

    if (upper.endsWith(marker)) {
      const base = upper.slice(0, -marker.length);
      // Only if something recognisable is left. `.PRO` alone is not a suffix on
      // an instrument, it is the whole name, and stripping it leaves nothing.
      if (base.length >= 3) return base;
    }
  }

  // A trailing `#` or `!` is a marker on every platform that uses it, and
  // unlike the list above it cannot be part of a real name.
  return upper.replace(/[#!]+$/, "");
}
