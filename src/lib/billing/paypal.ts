import { isProductionDeployment, isTestMode, sellingIsAllowed } from "./mode";

/** Thrown when billing is not configured, so routes can answer 503 not 500. */
export class BillingConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BillingConfigError";
  }
}

/**
 * The PayPal account that receives payments for this deployment.
 *
 * No API app, client id or secret involved: classic PayPal subscribe buttons
 * only need the receiving account's email address, supplied at checkout time
 * as a form field.
 */
export function businessEmail(): string {
  const email = process.env.PAYPAL_BUSINESS_EMAIL;
  if (!email) throw new BillingConfigError("PAYPAL_BUSINESS_EMAIL is not set");
  return email;
}

/** sandbox.paypal.com while testing, paypal.com once real money should move. */
function checkoutHost(): string {
  return isTestMode() ? "https://www.sandbox.paypal.com" : "https://www.paypal.com";
}

/** Exposed for a live reachability check — see `checkPayments` in `status/checks.ts`. */
export function checkoutOrigin(): string {
  return checkoutHost();
}

function ipnValidationHost(): string {
  return isTestMode()
    ? "https://ipnpb.sandbox.paypal.com"
    : "https://ipnpb.paypal.com";
}

/**
 * Builds the URL for PayPal's classic "Subscribe" checkout.
 *
 * `cmd=_xclick-subscriptions` and `business` are fixed; everything else is
 * supplied by the caller (item, amount, billing cycle, return URLs, etc.).
 */
export function subscribeUrl(fields: Record<string, string>): string {
  const url = new URL("/cgi-bin/webscr", checkoutHost());
  url.searchParams.set("cmd", "_xclick-subscriptions");
  url.searchParams.set("business", businessEmail());

  for (const [key, value] of Object.entries(fields)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

/**
 * Verifies an IPN message by posting it back to PayPal, byte for byte, with
 * `cmd=_notify-validate` prepended.
 *
 * Classic IPN carries no signature to check locally — this round trip is the
 * proof: only PayPal can confirm it sent the bytes it is now being handed
 * back, so a "VERIFIED" reply is what authenticates the message.
 */
export async function verifyIpn(rawBody: string): Promise<boolean> {
  const response = await fetch(new URL("/cgi-bin/webscr", ipnValidationHost()), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `cmd=_notify-validate&${rawBody}`,
  });

  const text = await response.text();
  return text.trim() === "VERIFIED";
}

// Re-exported so callers keep importing billing concerns from one place, while
// the logic itself lives in a module `npm test` can load. See `mode.ts`.
export { isProductionDeployment, isTestMode, sellingIsAllowed };

/**
 * Absolute origin for PayPal's return/notify URLs.
 *
 * PayPal rejects relative URLs, and a hardcoded production origin would send
 * anyone testing locally to the live site after paying.
 */
export function appOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");

  return new URL(request.url).origin;
}
