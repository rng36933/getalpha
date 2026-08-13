import { NextResponse } from "next/server";
import { checkAndSendNewsAlerts } from "@/lib/email/news-alert";
import { EmailConfigError } from "@/lib/email/resend";

/**
 * Polled every ~10 minutes by a GitHub Actions workflow, not Vercel Cron —
 * Vercel's Hobby plan cannot run a cron more often than once a day, which is
 * too coarse for a pre-release heads-up. See .github/workflows/news-alerts.yml.
 */
export const maxDuration = 60;

/**
 * Whether this request really came from the poller.
 *
 * A dedicated secret, not the daily-brief cron's `CRON_SECRET` — this route
 * is reachable far more often, from GitHub's infrastructure rather than
 * Vercel's, so a leak of one secret does not hand over the other job too.
 */
function isAuthorised(request: Request): boolean {
  const secret = process.env.NEWS_ALERT_CRON_SECRET;
  if (!secret) return false;

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * GET /api/cron/news-alert
 *
 * Public in the middleware, because the poller has no Clerk session. The
 * bearer secret is what authenticates it. Safe to call as often as the
 * poller likes — each event is claimed once via SentNewsAlert, so a call
 * that finds nothing due is nearly free and a call that finds something
 * already alerted sends nothing twice.
 */
export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  try {
    const result = await checkAndSendNewsAlerts();

    console.log(
      `News alert poll: ${result.checked} events checked, ${result.eligible} due, ` +
        `${result.sent} sent, ${result.failed} failed, ${result.skippedAlreadySent} already sent`,
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof EmailConfigError) {
      console.error("News alert cron is not configured:", error);
      return NextResponse.json(
        { error: "Email is not configured on this server" },
        { status: 503 },
      );
    }

    console.error("News alert cron failed:", error);
    return NextResponse.json(
      { error: "Could not check or send news alerts" },
      { status: 500 },
    );
  }
}
