/**
 * Versions of the documents a user agrees to.
 *
 * A consent record is only worth anything if it says *what* was agreed to. A
 * row that reads "accepted on 3 March" proves nothing once the terms have been
 * edited twice since — so the version is stored with the timestamp, and
 * changing a document means bumping its version here, which makes every
 * existing consent stale and asks each user again.
 *
 * Dates, not integers: in a dispute the question is "which text was on screen
 * that day", and a date answers it directly.
 */
export const LEGAL_VERSIONS = {
  terms: "2026-07-26",
  privacy: "2026-07-26",
  disclaimer: "2026-07-26",
} as const;

/**
 * The single string stored against an acceptance.
 *
 * One value rather than three columns, because consent is given to the set as
 * a whole — the checkbox does not let anyone accept two of the three.
 */
export const CURRENT_LEGAL_VERSION = [
  `terms@${LEGAL_VERSIONS.terms}`,
  `privacy@${LEGAL_VERSIONS.privacy}`,
  `disclaimer@${LEGAL_VERSIONS.disclaimer}`,
].join("|");

export const LEGAL_PAGES = [
  { href: "/terms", label: "Terms of Service", version: LEGAL_VERSIONS.terms },
  { href: "/privacy", label: "Privacy Policy", version: LEGAL_VERSIONS.privacy },
  { href: "/disclaimer", label: "Risk Disclaimer", version: LEGAL_VERSIONS.disclaimer },
] as const;

/**
 * Placeholders the operator must replace before launch.
 *
 * Left visible in the rendered pages on purpose. A document that says
 * "[COMPANY LEGAL NAME]" is obviously unfinished; one silently filled with a
 * plausible guess is a document nobody notices is wrong.
 */
export const OPERATOR = {
  legalName: "[COMPANY LEGAL NAME]",
  registrationNumber: "[COMPANY REGISTRATION NUMBER]",
  address: "[REGISTERED ADDRESS]",
  contactEmail: "[CONTACT EMAIL]",
  jurisdiction: "[COUNTRY OF REGISTRATION]",
} as const;
