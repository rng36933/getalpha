/**
 * Which PayPal environment this deployment is in, and whether it may sell
 * anything.
 *
 * Its own module rather than part of `paypal.ts` so `npm test` can reach it:
 * that file makes network calls at import-adjacent times, and the bare node
 * test runner resolves neither the `@/` alias nor that flow. Same split, and
 * the same reason, as `complimentary.ts` and `rate-limit/window.ts`.
 *
 * Both values are read as arguments with environment defaults, so a test can
 * state the situation it is describing instead of mutating `process.env`.
 */

/**
 * True while this deployment is pointed at PayPal's sandbox.
 *
 * Unlike Stripe, PayPal client ids carry no `sandbox`/`live` prefix to sniff,
 * so this is an explicit env var rather than inferred from the credential.
 */
export function isTestMode(
  env: string | undefined = process.env.PAYPAL_ENV,
): boolean {
  return env !== "live";
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
 * Sandbox mode on the live site is not a harmless placeholder. PayPal's
 * sandbox buyer accounts are free to create and complete a real approval
 * flow, and a sandbox checkout completes, fires a real webhook and writes a
 * real ACTIVE subscription. Pro would be free to anybody who thought to try
 * it, and the pricing page was inviting them to: it showed a sandbox-mode
 * banner to every signed-in visitor.
 *
 * So this fails closed, and it is checked in two places rather than one: at
 * checkout, so nobody can start; and at the webhook, so a replayed or
 * out-of-band sandbox event cannot grant entitlement even if a checkout
 * slipped through. Locally and on previews `VERCEL_ENV` is not "production",
 * so sandbox credentials keep working exactly as they did.
 */
export function sellingIsAllowed(
  env: string | undefined = process.env.PAYPAL_ENV,
  vercelEnv: string | undefined = process.env.VERCEL_ENV,
): boolean {
  return !(isProductionDeployment(vercelEnv) && isTestMode(env));
}
