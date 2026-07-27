/**
 * Which language a visitor is shown, and how that is decided.
 *
 * No imports: `npm test` runs the bare node runner, which resolves neither the
 * `@/` alias nor a missing extension, and the decision below is exactly the
 * kind of thing worth testing away from a browser.
 */

export const LOCALES = ["en", "lt"] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * The language served at the bare path, with no prefix.
 *
 * English keeps the unprefixed URLs because it is the audience this product is
 * aimed at — *"tikiuosi daugiau užsieniečių dėmesio nei lietuvių"* — and moving
 * it to `/en` would break every link already in the wild for the sake of
 * symmetry nobody benefits from.
 */
export const DEFAULT_LOCALE: Locale = "en";

/** Remembers a visitor's choice. Set only when they pick one themselves. */
export const LOCALE_COOKIE = "getalpha_locale";

/** A year. The choice is a preference, not a session. */
export const LOCALE_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "lt";
}

/**
 * The locale a path is already asking for, if any.
 *
 * `/lt` and `/lt/anything` are Lithuanian. `/lteral` is not — the check is on a
 * whole path segment, because a prefix match would quietly claim any route
 * whose name happens to start with those two letters.
 */
export function localeFromPath(pathname: string): Locale | null {
  const segment = pathname.split("/")[1];
  return segment === "lt" ? "lt" : null;
}

/** The same path under a different language, for links and hreflang tags. */
export function pathForLocale(pathname: string, locale: Locale): string {
  const bare = pathname.replace(/^\/lt(?=\/|$)/, "") || "/";
  if (locale === DEFAULT_LOCALE) return bare;
  return bare === "/" ? "/lt" : `/lt${bare}`;
}

/**
 * Which language to *suggest* to somebody who has not chosen one.
 *
 * A suggestion, and only on a first visit. It is deliberately not the whole
 * mechanism, for three reasons that all cost something if ignored:
 *
 * - **Googlebot crawls from the United States.** Serving Lithuanian by IP alone
 *   at one URL means the Lithuanian version is never seen and never indexed,
 *   which loses the entire point of translating it.
 * - A Lithuanian on a VPN, or abroad, gets the wrong language and has no way
 *   back — hence the cookie and a visible switcher, which win from then on.
 * - The header is Vercel's (`x-vercel-ip-country`) and is absent locally, so
 *   the absence of a country must mean "leave them alone", never "guess".
 */
export function suggestLocale(input: {
  /** The stored choice, if this visitor has made one. Beats everything else. */
  cookie?: string | null;
  /** ISO country code from the edge, or null when it is not known. */
  country?: string | null;
}): Locale {
  if (isLocale(input.cookie)) return input.cookie;
  if (input.country?.toUpperCase() === "LT") return "lt";

  return DEFAULT_LOCALE;
}
