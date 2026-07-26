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

/**
 * Providers where dots in the local part are decoration.
 *
 * Gmail ignores them entirely, so `u.s.e.r@gmail.com` and `user@gmail.com` are
 * one mailbox. Almost nobody else does this — Outlook and Fastmail treat dots as
 * significant — so the list stays short rather than merging two real people's
 * addresses at some provider that keeps them apart.
 */
const DOTS_IGNORED = new Set(["gmail.com", "googlemail.com"]);

/**
 * The mailbox an address actually reaches, so two spellings of one inbox
 * collapse to one string.
 *
 * Strips `+tags`, which every major provider treats as sub-addressing, and dots
 * at the providers that ignore them. This is what stops one person turning a
 * single Gmail account into three "different" invited users.
 *
 * It cannot stop somebody who owns three real mailboxes, and nothing can. The
 * error is deliberately in the conservative direction: a provider that treats
 * `+` as a literal character would have two real addresses merged and one
 * referral not counted, which costs a bonus rather than handing one out.
 *
 * Returns null when there is no mailbox to speak of.
 */
export function normalizeMailbox(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  const email = raw.trim().toLowerCase();
  const at = email.lastIndexOf("@");

  if (at <= 0 || at === email.length - 1) return null;

  let local = email.slice(0, at);
  let domain = email.slice(at + 1);

  const plus = local.indexOf("+");
  if (plus !== -1) local = local.slice(0, plus);

  // googlemail.com is an alias of gmail.com, not a separate provider.
  if (domain === "googlemail.com") domain = "gmail.com";
  if (DOTS_IGNORED.has(domain)) local = local.replaceAll(".", "");

  if (local === "" || !domain.includes(".")) return null;

  return `${local}@${domain}`;
}

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
