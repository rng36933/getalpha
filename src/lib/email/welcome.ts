import { fromAddress, resend } from "./resend";
import { welcomeHtml, welcomeSubject, welcomeText } from "./welcome-template";

/**
 * Sends the one-time welcome email for a newly created Clerk account.
 *
 * Transactional, not a subscription: it goes out regardless of the
 * `EmailPreference.dailyBrief` opt-in, the same way a password-reset email
 * would. There is nothing to unsubscribe from because there is only one.
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string | null,
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.getalpha.org";
  const input = { firstName, appUrl };

  const response = await resend().emails.send({
    from: fromAddress(),
    to: [email],
    subject: welcomeSubject(),
    html: welcomeHtml(input),
    text: welcomeText(input),
  });

  if (response.error) {
    throw new Error(`Resend rejected the welcome email: ${response.error.message}`);
  }
}
