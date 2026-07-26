/**
 * Which Stripe mode this deployment is in, and whether it may sell anything.
 *
 * Its own module rather than part of `stripe.ts` so `npm test` can reach it:
 * that file imports the Stripe SDK, and the bare node test runner resolves
 * neither the `@/` alias nor that package. Same split, and the same reason, as
 * `complimentary.ts` and `rate-limit/window.ts`.
 *
 * Both values are read as arguments with environment defaults, so a test can
 * state the situation it is describing instead of mutating `process.env`.
 */

/** True while the account is in test mode. */
export function isTestMode(
  secretKey: string | undefined = process.env.STRIPE_SECRET_KEY,
): boolean {
  return (secretKey ?? "").startsWith("sk_test_");
}

/** The live deployment, as opposed to a preview or somebody's laptop. */
export function isProductionDeployment(
  vercelEnv: string | undefined = process.env.VERCEL_ENV,
): boolean {
  return vercelEnv === "production";
}

/**
 * Whether this deployment is allowed to sell anything.
 *
 * Test-mode keys on the live site are not a harmless placeholder. Stripe's test
 * card numbers are published — `4242 4242 4242 4242` is known to anyone who has
 * opened Stripe's documentation — and a test checkout completes, fires a real
 * webhook and writes a real ACTIVE subscription. Pro would be free to anybody
 * who thought to try it, and the pricing page was inviting them to: it showed a
 * test-mode banner and printed that card number to every signed-in visitor.
 *
 * So this fails closed, and it is checked in two places rather than one: at
 * checkout, so nobody can start; and at the webhook, so a replayed or
 * out-of-band test event cannot grant entitlement even if a checkout slipped
 * through. Locally and on previews `VERCEL_ENV` is not "production", so test
 * keys keep working exactly as they did.
 */
export function sellingIsAllowed(
  secretKey: string | undefined = process.env.STRIPE_SECRET_KEY,
  vercelEnv: string | undefined = process.env.VERCEL_ENV,
): boolean {
  return !(isProductionDeployment(vercelEnv) && isTestMode(secretKey));
}
