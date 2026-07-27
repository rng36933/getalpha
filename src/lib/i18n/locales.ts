/**
 * The language a day-tape reading is labelled in.
 *
 * Landing-page localisation (the `/lt` route, the switcher, the cookie) was
 * removed 2026-07-28 — the site is English only now. What is left here is
 * only what `market-data/tape-copy.ts` still needs for the dashboard's
 * bilingual day-tape labels.
 *
 * No imports: `npm test` runs the bare node runner, which resolves neither
 * the `@/` alias nor a missing extension.
 */

export const LOCALES = ["en", "lt"] as const;
export type Locale = (typeof LOCALES)[number];
