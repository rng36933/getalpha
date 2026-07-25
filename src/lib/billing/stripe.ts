import Stripe from "stripe";

/** Thrown when billing is not configured, so routes can answer 503 not 500. */
export class BillingConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BillingConfigError";
  }
}

let client: Stripe | null = null;

/**
 * The Stripe client, created on first use.
 *
 * Not created at module load: importing anything from this file would then
 * throw during the build, on a machine that has no reason to hold a secret key.
 */
export function stripe(): Stripe {
  if (client) return client;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new BillingConfigError("STRIPE_SECRET_KEY is not set");
  }

  client = new Stripe(key);
  return client;
}

export function webhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new BillingConfigError("STRIPE_WEBHOOK_SECRET is not set");
  }
  return secret;
}

/** True while the account is in test mode. Drives the banner on the pricing page. */
export function isTestMode(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_");
}

/**
 * Absolute origin for Stripe's return URLs.
 *
 * Stripe rejects relative URLs, and a hardcoded production origin would send
 * anyone testing locally to the live site after paying.
 */
export function appOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");

  return new URL(request.url).origin;
}
