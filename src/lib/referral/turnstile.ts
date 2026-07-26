const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Cloudflare Turnstile, if it is configured.
 *
 * Optional on purpose. With no secret set this returns true and the form works
 * — a bot check that has to be configured before the feature functions at all
 * is a feature that ships broken. With a secret set the check is mandatory and
 * a missing token fails, so enabling it cannot half-apply.
 *
 * Turnstile rather than reCAPTCHA: no cookie, no cross-site profiling of the
 * visitor, and nothing to disclose in the privacy policy about advertising.
 */
export async function verifyTurnstile(
  token: unknown,
  remoteIp: string | null,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;

  if (typeof token !== "string" || token === "") return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });

    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    // Cloudflare being unreachable must not silently open the gate.
    console.error("Turnstile verification failed:", error);
    return false;
  }
}

export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}
