/**
 * Money, formatted the way a statement formats it.
 *
 * The account currency comes from the connected terminal (`MtConnection.
 * currency`), never from a guess: a EUR account and a USD account differ by
 * more than a symbol, and printing the wrong one on a P&L is worse than
 * printing none. When it is unknown the figure is shown bare — a number with
 * no symbol reads as "unknown currency", while a number with the wrong symbol
 * reads as a fact.
 *
 * Arithmetic and Intl only, no imports from the app, so `npm test` reaches it
 * directly.
 */

/** Currencies whose accounts this desk has actually seen, for a fast path. */
const ZERO_DECIMAL = new Set(["JPY", "KRW", "CLP", "ISK", "VND"]);

function decimalsFor(currency: string | null): number {
  if (currency && ZERO_DECIMAL.has(currency.toUpperCase())) return 0;
  return 2;
}

/**
 * A signed P&L, e.g. `+€340.00` or `−€120.50`.
 *
 * The sign is always printed, including on wins. A column of figures where
 * only the losses are marked makes the eye read the marks as the exceptions;
 * marking both makes direction part of the number rather than a decoration.
 *
 * A true minus sign (U+2212), not a hyphen — at the sizes these are set, a
 * hyphen next to a digit reads as a dash in the text.
 */
export function formatSignedMoney(
  amount: number,
  currency: string | null,
): string {
  const decimals = decimalsFor(currency);
  const sign = amount < 0 ? "−" : "+";
  const body = formatMoney(Math.abs(amount), currency, decimals);

  return `${sign}${body}`;
}

/** An unsigned amount, for risk and balances where direction is not the point. */
export function formatMoney(
  amount: number,
  currency: string | null,
  decimals = decimalsFor(currency),
): string {
  if (!currency) {
    return amount.toLocaleString("en-GB", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  return amount.toLocaleString("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * The same figure shortened for an axis tick, e.g. `+1.2k`.
 *
 * Axis labels are read as positions, not as amounts, so precision there costs
 * width without buying anything.
 */
export function formatCompactMoney(
  amount: number,
  currency: string | null,
): string {
  const sign = amount < 0 ? "−" : amount > 0 ? "+" : "";
  const size = Math.abs(amount);
  const symbol = currencySymbol(currency);

  if (size >= 1000) {
    const thousands = size / 1000;
    const digits = thousands < 10 ? 1 : 0;
    return `${sign}${symbol}${thousands.toFixed(digits)}k`;
  }

  return `${sign}${symbol}${size.toFixed(size < 10 ? 1 : 0)}`;
}

/**
 * The bare symbol, for axes and labels where the full format is too wide.
 *
 * Derived from Intl rather than kept as a table: a hand-written map is a list
 * of the currencies whoever wrote it happened to think of.
 */
export function currencySymbol(currency: string | null): string {
  if (!currency) return "";

  const parts = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).formatToParts(0);

  return parts.find((part) => part.type === "currency")?.value ?? "";
}
