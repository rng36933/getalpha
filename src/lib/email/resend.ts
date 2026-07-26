import { Resend } from "resend";

/** Thrown when email is not configured, so callers answer 503 rather than 500. */
export class EmailConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailConfigError";
  }
}

let client: Resend | null = null;

export function resend(): Resend {
  if (client) return client;

  const key = process.env.RESEND_API_KEY;
  if (!key) throw new EmailConfigError("RESEND_API_KEY is not set");

  client = new Resend(key);
  return client;
}

/**
 * The From address.
 *
 * Must be on a domain verified in Resend. Until one is, Resend only accepts
 * `onboarding@resend.dev`, and only to the account owner's own address — which
 * is enough to test the job but not to send to anybody else.
 */
export function fromAddress(): string {
  return process.env.EMAIL_FROM || "getALPHA <onboarding@resend.dev>";
}
