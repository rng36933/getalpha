import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { EmailConfigError } from "@/lib/email/resend";
import { previewPromo2x1, sendPromo2x1 } from "@/lib/email/promo-2x1-send";

/** See the note on `maxDuration` in `api/cron/daily-brief/route.ts` — same Hobby-plan ceiling. */
export const maxDuration = 60;

/** One-off campaign sender, gated the same way as the admin panel itself. */
async function requireAdmin(): Promise<string | null> {
  const { userId } = await auth();
  return isAdmin(userId) ? userId : null;
}

/**
 * GET /api/admin/send-promo
 *
 * Dry run: how many accounts are currently eligible for the 2-for-1 promo,
 * and a small sample of who they are. Sends nothing.
 */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const preview = await previewPromo2x1();
  return NextResponse.json(preview);
}

/**
 * POST /api/admin/send-promo
 *
 * Sends the campaign to up to 300 eligible accounts that have not already
 * received it (see `PromoEmailSent` and `sendPromo2x1`'s docblock on why this
 * is safe to call more than once — call it again if `remaining > 0`).
 */
export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await sendPromo2x1("getALPHA <support@getalpha.org>", 300);
    console.log(
      `Promo 2x1 send: ${result.sent} sent, ${result.failed} failed, ` +
        `${result.remaining} remaining of ${result.eligibleTotal} eligible`,
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof EmailConfigError) {
      console.error("Promo send is not configured:", error);
      return NextResponse.json(
        { error: "Email is not configured on this server" },
        { status: 503 },
      );
    }

    console.error("Promo send failed:", error);
    return NextResponse.json({ error: "Could not send the promo" }, { status: 500 });
  }
}
