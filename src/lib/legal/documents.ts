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
  terms: "2026-08-02",
  privacy: "2026-08-02",
  disclaimer: "2026-08-02",
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
 * The operator, filled from the individuali veikla certificate (No. 1534465,
 * issued 2026-08-02) and the Stripe account it matches.
 *
 * getALPHA runs as a Lithuanian sole proprietorship (individuali veikla)
 * rather than a company, so "registration number" here is the activity
 * certificate number, not a company registration number — there isn't one.
 * The certificate number is published rather than the personal taxpayer ID
 * that also appears on that document: the taxpayer ID is a national personal
 * code, and publishing it on a public page is a materially different kind of
 * exposure than publishing a business certificate number.
 *
 * legalName/address deliberately omit the operator's personal name and
 * street address — the certificate number plus country identifies the
 * business for legal purposes without publishing home-address-level detail.
 */
export const OPERATOR = {
  legalName: "The operator",
  registrationNumber: "1534465 (individuali veikla)",
  address: "Lithuania",
  contactEmail: "support@getalpha.org",
  jurisdiction: "Lithuania",
} as const;
