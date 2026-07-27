/**
 * Lithuanian noun agreement after a numeral.
 *
 * English needs two forms and picks between them by asking "is it one?".
 * Lithuanian needs three, and the rule is about the *last digits* rather than
 * the size of the number:
 *
 * - **one** — ends in 1, except 11: `1 žvakė`, `21 žvakė`, `101 žvakė`
 * - **few** — ends in 2–9, except 12–19: `5 žvakės`, `23 žvakės`
 * - **many** (genitive plural) — 0, 10–19, and anything ending in 0:
 *   `10 žvakių`, `12 žvakių`, `20 žvakių`, `0 žvakių`
 *
 * This matters here rather than being pedantry, because the numbers are
 * computed at render time and land in every band: the intraday reading counts
 * twelve bars (**many**), the average counts twenty (**many**), and the
 * agreement line counts up to five readings (**few**, or **one** when a single
 * one points somewhere). Hardcoding either plural would be visibly wrong on a
 * page whose whole argument is that it reports things accurately.
 *
 * No imports, so `npm test` can load it directly.
 */
export function ltPlural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(Math.trunc(n));
  const lastTwo = abs % 100;
  const last = abs % 10;

  // The teens are the exception to both rules below, and the reason this
  // cannot be written as a simple check on the final digit.
  if (lastTwo >= 11 && lastTwo <= 19) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 9) return few;

  return many;
}

/** The numeral and its noun together, in the form the numeral requires. */
export function ltCount(
  n: number,
  one: string,
  few: string,
  many: string,
): string {
  return `${n} ${ltPlural(n, one, few, many)}`;
}
