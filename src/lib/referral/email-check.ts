/**
 * Cheap, honest checks on an address before it goes in the waitlist.
 *
 * None of this proves an address is real — only a confirmation link does that.
 * What it does is raise the cost of signing the same person up two hundred
 * times, which is the abuse a waitlist actually attracts.
 */

/**
 * Domains that hand out throwaway inboxes.
 *
 * A blocklist is never complete and is not meant to be: new services appear
 * weekly. It stops the ones someone reaches for first, and the referral bonus
 * does not depend on it — that needs a verified account, which a throwaway
 * inbox can technically pass but nobody bothers to do three times.
 */
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "sharklasers.com",
  "dispostable.com",
  "maildrop.cc",
  "fakeinbox.com",
  "mohmal.com",
  "emailondeck.com",
  "spamgourmet.com",
  "mailnesia.com",
  "tempinbox.com",
  "burnermail.io",
]);

export type EmailCheck =
  | { ok: true; email: string }
  | { ok: false; reason: "INVALID" | "DISPOSABLE" };

/**
 * Deliberately permissive on shape.
 *
 * The full grammar for a valid address is far stranger than anyone expects,
 * and a strict regex mostly succeeds at rejecting real addresses belonging to
 * real people. This checks the parts that make an address unusable at all.
 */
const SHAPE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function checkEmail(raw: unknown): EmailCheck {
  if (typeof raw !== "string") return { ok: false, reason: "INVALID" };

  const email = raw.trim().toLowerCase();

  if (email.length < 6 || email.length > 254 || !SHAPE.test(email)) {
    return { ok: false, reason: "INVALID" };
  }

  const domain = email.slice(email.lastIndexOf("@") + 1);
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { ok: false, reason: "DISPOSABLE" };
  }

  return { ok: true, email };
}
