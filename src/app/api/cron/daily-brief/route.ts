import { NextResponse } from "next/server";
import { sendDailyBrief } from "@/lib/email/daily-brief";
import { EmailConfigError } from "@/lib/email/resend";

/**
 * Generating a brief is a Claude call; a cold start plus the model plus the
 * sends does not fit in the default ceiling.
 */
export const maxDuration = 300;

/**
 * Whether this request really came from the scheduler.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Without the secret
 * set the route refuses everything rather than defaulting to open — this
 * endpoint spends money on a model call and mails every subscriber, so an
 * unauthenticated caller could do both repeatedly.
 */
function isAuthorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * GET /api/cron/daily-brief
 *
 * Sends the morning Session Brief to everyone who asked for it and is entitled
 * to it. Safe to call more than once a day: the first call claims the date and
 * the rest report ALREADY_SENT.
 *
 * Public in the middleware, because the scheduler has no Clerk session. The
 * bearer secret is what authenticates it.
 */
export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  try {
    const result = await sendDailyBrief();

    console.log(
      `Daily brief ${result.briefDate}: ${result.status}, ` +
        `${result.recipientCount} sent, ${result.failureCount} failed`,
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof EmailConfigError) {
      console.error("Daily brief cron is not configured:", error);
      return NextResponse.json(
        { error: "Email is not configured on this server" },
        { status: 503 },
      );
    }

    console.error("Daily brief cron failed:", error);
    return NextResponse.json(
      { error: "Could not send the daily brief" },
      { status: 500 },
    );
  }
}
